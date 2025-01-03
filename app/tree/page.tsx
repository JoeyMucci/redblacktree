'use client';

import { useDisclosure } from '@mantine/hooks';
import { Button, Divider, Group, NumberInput, Stack, Switch, Modal, Text, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { useState } from 'react';

interface Node {
    value: number
    isRed: boolean
    left: Node | null
    right: Node | null
    parent: Node | null
    highlighted? : boolean
}

const MIN = 0;
const MAX = 1000;

const makeNullNode = (par : Node | null) : Node => {
    return {value: MIN, isRed: false, left: null, right: null, parent: par};
}

const isNullNode = (n : Node) : boolean => { return n.value === MIN }

const isRoot = (n : Node) : boolean => { return !n.parent }

let root : Node = makeNullNode(null);

const isLeftChild = (n : Node) : boolean => { return !isRoot(n) && n.value === n.parent!.left!.value }

const assignLeftChild = (parent: Node, child : Node) : void => {
    parent.left = child;
    child.parent = parent;
}

const assignRightChild = (parent: Node, child : Node) : void => {
    parent.right = child;
    child.parent = parent;
}

const transferParent = (oldChild: Node, newChild: Node) : void => {
    if(isRoot(oldChild)) {
        root = newChild;
        newChild.parent = null;
    }
    else if(isLeftChild(oldChild)) {
        assignLeftChild(oldChild.parent!, newChild);
    }
    else {
        assignRightChild(oldChild.parent!, newChild);
    }
}

// The newRoot for a rotation will never be the old root or a null node
const rightRotate = (newRoot : Node) : void => {
    const par = newRoot.parent!;
    transferParent(par, newRoot);
    assignLeftChild(par, newRoot.right!);
    assignRightChild(newRoot, par);
}

const leftRotate = (newRoot : Node) : void => {
    const par = newRoot.parent!;
    transferParent(par, newRoot);
    assignRightChild(par, newRoot.left!);
    assignLeftChild(newRoot, par);
}



export default function Tree() {
    const [, setRerenders] = useState<number>(0);
    const [showAlerts, setShowAlerts] = useState<boolean>(true);
    const [showValues, setShowValues] = useState<boolean>(true); 
    const [showNulls, setShowNulls] = useState<boolean>(true);
    const [insertVal, setInsertVal] = useState<string | number>('');
    const [deleteVal, setDeleteVal] = useState<string | number>('');
    const [modalTitle, setModalTitle] = useState<string>('');
    const [modalMessage, setModalMessage] = useState<string>('');
    const [opened, { open, close }] = useDisclosure(false);

    const [cleanupAction, setCleanupAction] = useState<string>('No Additional Action Required');
    const [saveNode, setSaveNode] = useState<Node>(makeNullNode(null));
    const [highlightedNode, setHighlightedNode] = useState<Node>(makeNullNode(null));

    const confirmResetTree = () => modals.openConfirmModal({
        title: 'Are you sure you want to reset the tree?',
        children: (
          <Text size="sm">
            This action will erase all the nodes in the tree.
          </Text>
        ),
        labels: { confirm: 'Confirm', cancel: 'Cancel' },
        onConfirm: () => {root = makeNullNode(null); setRerenders((prev) => prev + 1)},
        onCancel: () => {},
      });

    const highlight = (n : Node) : void => {
        highlightedNode.highlighted = false;
        n.highlighted = true;
        setHighlightedNode(n);
    }

    const handleClose = () : void => {
        close();
        doCleanupAction(cleanupAction, saveNode);
        setRerenders((prev) => prev + 1);
    }

    const doCleanupAction = (cleanAct : string, saveN : Node) : void => {
        if(cleanAct === 'Turn Root Black') {
            root.isRed = false;
        }
        else if(cleanAct === 'Red Alert - Recolor and Move Up') {
            saveN.isRed = true;
            saveN.left!.isRed = false;
            saveN.right!.isRed = false;
            handleRedAlert(saveN);
        }
        else if(cleanAct === 'Red Alert - Left Rotate Red Pair to Outside') {
            leftRotate(saveN);
            handleRedAlert(saveN.left!);
        }
        else if(cleanAct === 'Red Alert - Right Rotate Red Pair to Outside') {
            rightRotate(saveN);
            handleRedAlert(saveN.right!);
        }
        else if(
            cleanAct === 'Red Alert - Right Rotate and Swap Colors' || 
            cleanAct === 'Lack of Black - Right Rotate and Swap Colors to Get Black Sibling' ||
            cleanAct === 'Lack of Black - Right Rotate and Swap Colors to Get Outside Red') {
                rightRotate(saveN);
                saveN.right!.isRed = true;
                saveN.isRed = false;
                if(cleanAct === 'Lack of Black - Right Rotate and Swap Colors to Get Black Sibling') {
                    handleLackOfBlack(saveN.right!.right!, true);
                }
                else if(cleanAct === 'Lack of Black - Right Rotate and Swap Colors to Get Outside Red') {
                    handleLackOfBlack(saveN.parent!.left!, false)
                }
        }
        else if(
            cleanAct === 'Red Alert - Left Rotate and Swap Colors' || 
            cleanAct === 'Lack of Black - Left Rotate and Swap Colors to Get Black Sibling' || 
            cleanAct === 'Lack of Black - Left Rotate and Swap Colors to Get Outside Red') {
                leftRotate(saveN);
                saveN.left!.isRed = true;
                saveN.isRed = false;
                if(cleanAct === 'Lack of Black - Left Rotate and Swap Colors to Get Black Sibling') {
                    handleLackOfBlack(saveN.left!.left!, false);
                }
                else if(cleanAct === 'Lack of Black - Left Rotate and Swap Colors to Get Outside Red') {
                    handleLackOfBlack(saveN.parent!.right!, true)
                }
        }
        else if(cleanAct === 'Lack of Black - Right Rotate and Color New Children Black' || cleanAct === 'Lack of Black - Left Rotate and Color New Children Black') {
            const wasParentRed : boolean = saveN.parent!.isRed;
            if(cleanAct === 'Lack of Black - Right Rotate and Color New Children Black') {
                rightRotate(saveN);
            }
            else {
                leftRotate(saveN);
            }
            saveN.isRed = wasParentRed;
            saveN.left!.isRed = false;
            saveN.right!.isRed = false;
        }
        else if(cleanAct === 'Lack of Black - Swap Colors of Parent and Sibling') {
            saveN.isRed = true;
            saveN.parent!.isRed = false;
        }
        else if(cleanAct === 'Lack of Black - Color Sibling Red and Move Up') {
            saveN.isRed = true;
            handleLackOfBlack(saveN.parent!, !isLeftChild(saveN.parent!));
        }
        else if(cleanAct === 'Replace Parent with Red Child Turned Black') {
            saveN.isRed = false;
            transferParent(saveN.parent!, saveN);
        }
        else if(cleanAct === 'Simply Remove the Red Node') {
            const nullNode : Node = makeNullNode(null);
            transferParent(saveN, nullNode);
        }
        else if(cleanAct === 'Replace Value with In-Order Predecessor to Get One Child') {
            const iop = inOrderPredecessor(saveN.value);
            saveN.value = iop;
            remove(saveN.left!, iop);
        }
    }

    const setupBreakpoint =  (msg : string, cleanAct: string, saveN : Node, highN : Node) : void => {
        if(showAlerts) {
            setModalTitle(cleanAct);
            setModalMessage(msg);
            open();
            setCleanupAction(cleanAct);
            setSaveNode(saveN)
            highlight(highN);
        } 
        else {
            doCleanupAction(cleanAct, saveN);
        }
    }

    const handleRedAlert =  (baseRed: Node) : void => {
        // Root is red => make it black
        if(isRoot(baseRed)) {
            setupBreakpoint(
                `The new red node (${baseRed.value}) is the root, but the root must always be black.`,
                'Turn Root Black',
                makeNullNode(null),
                makeNullNode(null),
            );
            return;
        }
    
        // Stop if parent is not red (i.e. there is no double red)
        if(!baseRed.parent!.isRed) {
            setupBreakpoint(
                `The new red node (${baseRed.value}) has a black parent (${baseRed.parent!.value}), so there is no double red.`,
                'No Additional Action Required',
                makeNullNode(null),
                makeNullNode(null),
            );
            return;
        }
    
        // Grandpa must exist since parent is red and all reds have parents
        const grandpa : Node = baseRed.parent!.parent!;
        const firstRedLeft : boolean = isLeftChild(baseRed.parent!);
        const uncle : Node = firstRedLeft ? grandpa.right! : grandpa.left!;
    
        // CASE 1: Red Uncle => Recolor parents, grandpa and move issue upwards
        if(uncle.isRed) {
            setupBreakpoint(
                `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a red sibling (${uncle.value}). 
                    Change colors of the parent, its sibling, and the grandparent (${grandpa.value}) before checking for another RED ALERT at the grandparent.`,
                'Red Alert - Recolor and Move Up',
                grandpa,
                makeNullNode(null),
            );
        }
    
        // CASE 2: Black Uncle => Rotate and make newRoot black, children of newRoot red
        else {
            const secondRedLeft: boolean = isLeftChild(baseRed);
    
            // Double red on the inside => Setup Rotation
            if(firstRedLeft !== secondRedLeft) {
                if(firstRedLeft) {
                    setupBreakpoint(
                        `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling (${uncle.value > 0 ? uncle.value : "Null"}).
                        Since ${baseRed.value} is on the inside, we left rotate the pair to the outside to reach a simpler a case.`,
                        'Red Alert - Left Rotate Red Pair to Outside',
                        baseRed,
                        makeNullNode(null),
                    );
                }
                else {
                    setupBreakpoint(
                        `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling (${uncle.value > 0 ? uncle.value : "Null"}).
                        Since ${baseRed.value} is on the inside, we right rotate the pair to the outside to reach a simpler a case.`,
                        'Red Alert - Right Rotate Red Pair to Outside',
                        baseRed,
                        makeNullNode(null),
                    );
                }
            }
    
            // Double red on the outside => Single Rotation
            else if(firstRedLeft) {
                    setupBreakpoint(
                        `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling (${uncle.value > 0 ? uncle.value : "Null"}).
                        Since ${baseRed.value} is on the outside, we right rotate the red chain up. Also swap colors of the parent and grandparent (${grandpa.value}).`,
                        'Red Alert - Right Rotate and Swap Colors',
                        baseRed.parent!,
                        makeNullNode(null),
                    );
                }
            else {
                setupBreakpoint(
                    `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling (${uncle.value > 0 ? uncle.value : "Null"}).
                        Since ${baseRed.value} is on the outside, we left rotate the red chain up. Also swap colors of the parent and grandparent (${grandpa.value}).`,
                    'Red Alert - Left Rotate and Swap Colors',
                    baseRed.parent!,
                    makeNullNode(null),
                );
            }
        }  
    }

    const handleLackOfBlack = (baseBlack : Node, siblingLeft: boolean) : void => {
        // Root cannot have a lack of black
        if(isRoot(baseBlack)) {
            setupBreakpoint(
                `The new black node (highlighted) is the root, but the root cannot have insufficient black height.`,
                'No Additional Action Required',
                makeNullNode(null),
                baseBlack
            );
            return;
        }
    
        const sibling : Node = siblingLeft ? baseBlack.parent!.left! : baseBlack.parent!.right!;
    
        // CASE 1: Red Sibling => Setup rotation to get black sibling
        if(sibling.isRed) {
            if(siblingLeft) {
                setupBreakpoint(
                    `The new black node (highlighted) has a red sibling (${sibling.value}), we right rotate the sibling up to reach a simpler case (black sibling).`,
                    'Lack of Black - Right Rotate and Swap Colors to Get Black Sibling',
                    sibling,
                    baseBlack
                );
            }
            else {
                setupBreakpoint(
                    `The new black node (highlighted) has a red sibling (${sibling.value}), we left rotate the sibling up and swap the colors of the sibling and its 
                    pre-rotation parent (${sibling.parent!.value}) to reach a simpler case (black sibling).`,
                    'Lack of Black - Left Rotate and Swap Colors to Get Black Sibling',
                    sibling,
                    baseBlack
                );
            }
        }
    
        // CASE 2: Black Sibling 

        // First try to find a red child of sibling to rotate
        // One and done rotation (sibling and red are in same direction)
        else if(siblingLeft ? sibling.left!.isRed : sibling.right!.isRed) {
            if(siblingLeft) {
                setupBreakpoint(
                    `The new black node (highlighted) has a black sibling (${sibling.value}) with a red child on the outside (${sibling.left!.value}). We right rotate the sibling up the tree. The sibling keeps the color
                    of its parent (${baseBlack.parent!.isRed ? "red" : "black"}), and its new children (${sibling.left!.value}) and (${baseBlack.parent!.value}) are both colored black.`,
                    'Lack of Black - Right Rotate and Color New Children Black',
                    sibling, 
                    baseBlack
                );
            }
            else {
                setupBreakpoint(
                    `The new black node (highlighted) has a black sibling (${sibling.value}) with a red child on the outside (${sibling.right!.value}). We right rotate the sibling up the tree. The sibling keeps the color
                    of its parent (${baseBlack.parent!.isRed ? "red" : "black"}), and its new children (${sibling.right!.value}) and (${baseBlack.parent!.value}) are both colored black.`,
                    'Lack of Black - Left Rotate and Color New Children Black',
                    sibling, 
                    baseBlack
                );
            }
        }
    
        // Setup rotation (sibling and red are in different direction)
        else if(siblingLeft ? sibling.right!.isRed : sibling.left!.isRed) {
            if(siblingLeft) {
                setupBreakpoint(
                    `The new black node (highlighted) has a black sibling (${sibling.value}) with a red child on the inside (${sibling.right!.value}). We left rotate the sibling down and swap colors
                    of the sibling and the inside child to reach a simpler case (red child on the outside).`,
                    'Lack of Black - Left Rotate and Swap Colors to Get Outside Red',
                    sibling.right!,
                    baseBlack,
                )
            }
            else {
                setupBreakpoint(
                    `The new black node (highlighted) has a black sibling (${sibling.value}) with a red child on the inside (${sibling.left!.value}). We right rotate the sibling down and swap colors
                    of the sibling and the inside child to reach a simpler case (red child on the outside).`,
                    'Lack of Black - Right Rotate and Swap Colors to Get Outside Red',
                    sibling.right!,
                    baseBlack,
                )
            }
        }
            
        // There are no red children of sibling => recolor sibling 
        // red and potentially move lack of black upwards
        else if(baseBlack.parent!.isRed) {
                setupBreakpoint(
                    `The new black node (highlighted) has a black sibling (${sibling.value}) with no red child. Since the parent (${baseBlack.parent!.value}) is red, we swap the colors of the parent
                    and the sibling.`,
                    'Lack of Black - Swap Colors of Parent and Sibling',
                    sibling, 
                    baseBlack
                );
            }
        else {
            setupBreakpoint(
                `The new black node (highlighted) has a black sibling (${sibling.value}) with no red child. Since the parent (${baseBlack.parent!.value}) is black, we color the sibling red
                and move the LACK OF BLACK up to the parent.`,
                'Lack of Black - Color Sibling Red and Move Up',
                sibling, 
                baseBlack
            );
        }
    }

    const insert = (current: Node, val: number) : void => {
        if(val <= MIN || val >= MAX) {
            notifications.show({
                title: 'Invalid Value for Insert',
                color: 'red',
                message: `The integer value must be in the range ${MIN + 1}-${MAX - 1} inclusive.`,
            });
        }
        else if(val === current.value) {
            notifications.show({
                title: 'Invalid Value for Insert',
                color: 'red',
                message: `The value ${val} is already in the tree.`,
            });
        }
        else if(isNullNode(current)) {
            current.value = val;
            current.isRed = true;
            current.left = makeNullNode(current);
            current.right = makeNullNode(current);
            handleRedAlert(current);
            if(!showAlerts) {
                setRerenders((prev) => prev + 1);
            }   
        }
        else if(val < current.value) {
            insert(current.left!, val);
        }
        else {
            insert(current.right!, val);
        }
    }

    // This method's job is to find a value that will make the 
    // node be inserted where tapped and then call insert
    const insertWrapper = (n : Node, isLeft: boolean) : void => {
        if(isRoot(n)) {
            insert(root, Math.floor((MIN + MAX) / 2));
        }
        else {
            let maxi : number, mini : number;
            if(isLeft) {
                maxi = n.parent!.value;
                mini = inOrderPredecessor(maxi);
            }
            else {
                mini = n.parent!.value;
                maxi = inOrderSuccessor(mini);
            }
            insert(root, Math.floor((mini + maxi) / 2));
        }
    }

    const remove = (current: Node, val: number) : void => {
        if(!current) {
            notifications.show({
                title: 'Invalid Value for Delete',
                color: 'red',
                message: `The value ${val} is not in the tree.`,
            });
        }
        else if(current.value === val) {
            const hasLeftChild : boolean = !isNullNode(current.left!);
            const hasRightChild : boolean = !isNullNode(current.right!);
            let skipUpdate : boolean = false;

            if(!hasLeftChild && !hasRightChild) {
                if(!current.isRed) {
                    const nullNode : Node = makeNullNode(null);
                    const ilc = isLeftChild(current);
                    transferParent(current, nullNode);   
                    handleLackOfBlack(nullNode, !ilc);
                }
                else {
                    setupBreakpoint(
                        `The node we are removing (highlighted ${val}) is red, so no properties of the Red-Black Tree can be violated.`,
                        'Simply Remove the Red Node',
                        current,
                        current
                    );
                }
            }
            
            // One child => child is red => current is black => 
            // Remove current and replace it with its child, 
            // color it black so no lack of black
            else if(hasLeftChild && !hasRightChild) {
                setupBreakpoint(
                    `We are trying to remove the highlighted ${val} but it has one red child (${current.left!.value}), so we need to have the child take the place and the color of the removed node.`,
                    'Replace Parent with Red Child Turned Black',
                    current.left!,
                    current
                );
            }
            else if(!hasLeftChild && hasRightChild) {
                setupBreakpoint(
                    `We are trying to remove the highlighted ${val} but it has one red child (${current.right!.value}), so we need to have the child take the place and the color of the removed node.`,
                    'Replace Parent with Red Child Turned Black',
                    current.right!,
                    current
                );
            }

            

            // Two children => Copy value of predecessor into 
            // current node then delete the predecessor 
            else {
                setupBreakpoint(
                    `We are trying to remove (${val}) but it has two children (${current.left!.value} and ${current.right!.value}), so we need to find the largest value in the tree
                    smaller than ${val}, put that value where ${val} is, and then delete the node that originally held that value.`,
                    'Replace Value with In-Order Predecessor to Get One Child',
                    current,
                    makeNullNode(null)
                );
                skipUpdate = true; 
            }

            if(!skipUpdate && !showAlerts) {
                setRerenders((prev) => prev + 1);
            }
            
        }
        else if(val < current.value) {
            remove(current.left!, val);
        }
        else {
            remove(current.right!, val);
        }
    }

    const inOrder = (n : Node) : Node[] => {
        if(n.left === null || n.right === null) {
            return [];
        }
        const before = inOrder(n.left);
        const after = inOrder(n.right);
        return before.concat(n, after);
    }

    const inOrderPredecessor = (val : number) : number => {
        const io = inOrder(root);
        const index = io.findIndex((n : Node) => n.value === val)
        return (index === -1 || index === 0) ? MIN : io[index - 1].value;
    }

    const inOrderSuccessor = (val : number) : number => {
        const io = inOrder(root);
        const index = io.findIndex((n : Node) => n.value === val)
        return (index === -1 || index === io.length - 1) ? MAX : io[index + 1].value;
    }

    const drawTree = (n : Node | null, left : boolean) : JSX.Element => {
        if(n === null) {
            return (
                <></>
            )
        }

        const showHighlight : boolean = n.highlighted !== null && n.highlighted! && opened;

        const color : string = n.isRed ? "red" : "black";
        const style : { color: string } = showHighlight ? { color : 'gold' } : {color : 'white'}; // This is text color
        const content : number | string = showValues ? (n.value > 0 ? n.value : 'Null') : (showHighlight ? "!" : "");
        const action : () => void = isNullNode(n) ? () => insertWrapper(n, left) : () => remove(root, n.value); // Click on null nodes to add, non-null nodes to remove that node

        return (
            <Stack align="center">
                {(!isNullNode(n) || showNulls || showHighlight) && (
                    <Button style={style} color={color} radius="xl" size="compact-md" onClick={action}>
                        {content}
                    </Button>
                )}
                <Group wrap="nowrap" align="flex-start">
                    {drawTree(n.left, true)}
                    {drawTree(n.right, false)}
                </Group>
            </Stack>
        )
    }

    return (
        <>
            <Text size="xl" ta="center">
                You can insert by clicking on null nodes and delete by clicking on non-null nodes
            </Text>
            <Group style={{ margin: "10px"}} justify="center">
                <Stack style={{ width : "100px"}}>
                    <NumberInput 
                        radius="xl"
                        allowDecimal={false}
                        min={MIN + 1}
                        max={MAX - 1}
                        value={insertVal}
                        onChange={setInsertVal}
                    />
                    <Button radius="xl" disabled={insertVal === ""} onClick={() => {insert(root, insertVal as number); setInsertVal("")}}>
                        Insert
                    </Button>
                </Stack>

                <Stack style={{ width : "100px"}}>
                    <NumberInput 
                        radius="xl"
                        allowDecimal={false}
                        min={MIN + 1}
                        max={MAX - 1}
                        value={deleteVal}
                        onChange={setDeleteVal}
                    />
                    <Button radius="xl" disabled={deleteVal === ""} onClick={() => {remove(root, deleteVal as number); setDeleteVal("")}}>
                        Delete
                    </Button>
                </Stack>

                <Stack>
                    <Switch
                        checked={showAlerts}
                        onChange={(event) => setShowAlerts(event.currentTarget.checked)}
                        label="Explanation"
                        labelPosition="right"
                    />

                    <Switch
                        checked={showValues}
                        onChange={(event) => setShowValues(event.currentTarget.checked)}
                        label="Show Values"
                        labelPosition="right"
                    />

                    <Switch
                        checked={showNulls}
                        onChange={(event) => setShowNulls(event.currentTarget.checked)}
                        label="Show Nulls"
                        labelPosition="right"
                    />
                </Stack>
            </Group>
            <Center>
                <Button radius="xl" onClick={confirmResetTree}>
                    Reset Tree
                </Button>
            </Center>
            <Divider my="md" style={{width:'100%'}} color='white'/>
            {drawTree(root, false)} 
            <Modal opened={opened} onClose={handleClose} title={modalTitle}>
                <Text size="sm">
                    {modalMessage}
                </Text>
            </Modal>
        </>
    )
}