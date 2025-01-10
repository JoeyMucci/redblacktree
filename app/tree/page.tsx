'use client';

import { useDisclosure } from '@mantine/hooks';
import { Button, Divider, Group, NumberInput, Stack, Switch, Modal, Text, Center } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { ChangeEvent, useState } from 'react';

interface Node {
    value: number
    isRed: boolean
    left: Node | null
    right: Node | null
    parent: Node | null
    highlighted? : boolean
}

export default function Tree() {
    // Null Nodes have value = MIN
    const makeNullNode = (par : Node | null) : Node => { return {value: MIN, isRed: false, left: null, right: null, parent: par} }
    const isNullNode = (n : Node) : boolean => { return n.value === MIN }
    const isLeftChild = (n : Node) : boolean => { return !isRoot(n) && n.value === n.parent!.left!.value }
    const isRoot = (n : Node) : boolean => { return !n.parent }
    const MIN = 0;
    const MAX = 1000;
    const [, setRerenders] = useState<number>(0);
    const [root, setRoot] = useState<Node>(makeNullNode(null));
    const [showAlerts, setShowAlerts] = useState<boolean>(true);
    const [showValues, setShowValues] = useState<boolean>(true); 
    const [showNulls, setShowNulls] = useState<boolean>(true);
    const [insertVal, setInsertVal] = useState<string | number>('');
    const [deleteVal, setDeleteVal] = useState<string | number>('');
    const [modalTitle, setModalTitle] = useState<string>('');
    const [modalMessage, setModalMessage] = useState<string>('');
    const [opened, { open, close }] = useDisclosure(false);
    const [resolveAction, setResolveAction] = useState<string>('No Additional Action Required');
    const [saveNode, setSaveNode] = useState<Node>(makeNullNode(null));
    const [highlightedNode, setHighlightedNode] = useState<Node>(makeNullNode(null));

    // AUXILIARY FUNCTIONS

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
            setRoot(newChild);
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
    const leftRotate = (newRoot : Node) : void => {
        const par = newRoot.parent!;
        transferParent(par, newRoot);
        assignRightChild(par, newRoot.left!);
        assignLeftChild(newRoot, par);
    }

    const rightRotate = (newRoot : Node) : void => {
        const par = newRoot.parent!;
        transferParent(par, newRoot);
        assignLeftChild(par, newRoot.right!);
        assignRightChild(newRoot, par);
    }

    // CORE FUNCTIONS

    // resolveAct specifies which action to do, saveN specifies a Node crucial to the action
    const resolveOperation = (resolveAct : string, saveN : Node) : void => {
        if(resolveAct === 'Turn Root Black') {
            root.isRed = false;
        }

        else if(resolveAct === 'Red Alert - Recolor and Move Up') {
            saveN.isRed = true;
            saveN.left!.isRed = false;
            saveN.right!.isRed = false;
            handleRedAlert(saveN);
        }

        // Setup Rotations
        else if(resolveAct === 'Red Alert - Left Rotate Red Pair to Outside') {
            leftRotate(saveN);
            handleRedAlert(saveN.left!);
        }
        else if(resolveAct === 'Red Alert - Right Rotate Red Pair to Outside') {
            rightRotate(saveN);
            handleRedAlert(saveN.right!);
        }

        // These three actions share rotation + recoloring, the Lack of Black's are setup steps though
        // Either red sibling => black sibling or inside red => outside red
        else if(
            resolveAct === 'Red Alert - Right Rotate and Swap Colors' || 
            resolveAct === 'Lack of Black - Right Rotate and Swap Colors to Get Black Sibling' ||
            resolveAct === 'Lack of Black - Right Rotate and Swap Colors to Get Outside Red'
            ) {
                rightRotate(saveN);
                saveN.right!.isRed = true;
                saveN.isRed = false;
                if(resolveAct === 'Lack of Black - Right Rotate and Swap Colors to Get Black Sibling') {
                    handleLackOfBlack(saveN.right!.right!, true);
                }
                else if(resolveAct === 'Lack of Black - Right Rotate and Swap Colors to Get Outside Red') {
                    handleLackOfBlack(saveN.parent!.left!, false)
                }
        }
        else if(
            resolveAct === 'Red Alert - Left Rotate and Swap Colors' || 
            resolveAct === 'Lack of Black - Left Rotate and Swap Colors to Get Black Sibling' || 
            resolveAct === 'Lack of Black - Left Rotate and Swap Colors to Get Outside Red'
            ) {
                leftRotate(saveN);
                saveN.left!.isRed = true;
                saveN.isRed = false;
                if(resolveAct === 'Lack of Black - Left Rotate and Swap Colors to Get Black Sibling') {
                    handleLackOfBlack(saveN.left!.left!, false);
                }
                else if(resolveAct === 'Lack of Black - Left Rotate and Swap Colors to Get Outside Red') {
                    handleLackOfBlack(saveN.parent!.right!, true)
                }
        }

        else if(
            resolveAct === 'Lack of Black - Right Rotate and Color New Children Black' || 
            resolveAct === 'Lack of Black - Left Rotate and Color New Children Black'
            ) {
                const wasParentRed : boolean = saveN.parent!.isRed;
                if(resolveAct === 'Lack of Black - Right Rotate and Color New Children Black') {
                    rightRotate(saveN);
                }
                else {
                    leftRotate(saveN);
                }
                saveN.isRed = wasParentRed;
                saveN.left!.isRed = false;
                saveN.right!.isRed = false;
        }

        else if(resolveAct === 'Lack of Black - Swap Colors of Parent and Sibling') {
            saveN.isRed = true;
            saveN.parent!.isRed = false;
        }

        else if(resolveAct === 'Lack of Black - Color Sibling Red and Move Up') {
            saveN.isRed = true;
            handleLackOfBlack(saveN.parent!, !isLeftChild(saveN.parent!));
        }

        else if(resolveAct === 'Replace Parent with Red Child Turned Black') {
            saveN.isRed = false;
            transferParent(saveN.parent!, saveN);
        }

        else if(resolveAct === 'Simply Remove the Red Node') {
            const nullNode : Node = makeNullNode(null);
            transferParent(saveN, nullNode);
        }

        else if(resolveAct === 'Replace Value with In-Order Predecessor to Get One Child') {
            const iop = orderHelper().inOrderPredecessor(saveN.value);
            saveN.value = iop;
            del(saveN.left!, iop);
        }
    }

    // Lays the groundwork for processing an the next operation in the step sequence
    // after the explanation modal is closed. If explanations are turned off then
    // resolve the operation immediately (no need for user interaction).
    const initiateStep =  (resolveAct : string, msg: string, saveN : Node, highN : Node) : void => {
        // Sets the highlighted node for use in certain explanations
        const highlight = (n : Node) : void => {
            highlightedNode.highlighted = false;
            n.highlighted = true;
            setHighlightedNode(n);
        }

        if(showAlerts) {
            setModalTitle(resolveAct);
            setModalMessage(msg);
            open();
            setResolveAction(resolveAct);
            setSaveNode(saveN)
            highlight(highN);
        } 
        else {
            resolveOperation(resolveAct, saveN);
        }
    }

    const handleRedAlert =  (baseRed: Node) : void => {
        // Root is red => make it black
        if(isRoot(baseRed)) {
            initiateStep(
                'Turn Root Black',
                `The new red node (${baseRed.value}) is the root, but the root must always be black.`,
                makeNullNode(null),
                makeNullNode(null),
            );
            return;
        }
    
        // Stop if parent is not red (i.e. there is no double red)
        if(!baseRed.parent!.isRed) {
            initiateStep(
                'No Additional Action Required',
                `The new red node (${baseRed.value}) has a black parent (${baseRed.parent!.value}), so there is no double red.`,
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
            initiateStep(
                'Red Alert - Recolor and Move Up',
                `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a red sibling (${uncle.value}). 
                Change colors of the parent, its sibling, and the grandparent (${grandpa.value}) before checking for another RED ALERT 
                at the grandparent.`,
                grandpa,
                makeNullNode(null),
            );
        }
    
        // CASE 2: Black Uncle => Rotate and make the new root black, children of new root red
        else {
            const secondRedLeft: boolean = isLeftChild(baseRed);
    
            // Double red on the inside => Setup Rotation
            if(firstRedLeft !== secondRedLeft) {
                if(firstRedLeft) {
                    initiateStep(
                        'Red Alert - Left Rotate Red Pair to Outside',
                        `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling 
                        (${uncle.value > 0 ? uncle.value : "Null"}).
                        Since ${baseRed.value} is on the inside, we left rotate the pair to the outside to reach a simpler a case.`,
                        baseRed,
                        makeNullNode(null),
                    );
                }
                else {
                    initiateStep(
                        'Red Alert - Right Rotate Red Pair to Outside',
                        `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling 
                        (${uncle.value > 0 ? uncle.value : "Null"}).
                        Since ${baseRed.value} is on the inside, we right rotate the pair to the outside to reach a simpler a case.`,
                        baseRed,
                        makeNullNode(null),
                    );
                }
            }
    
            // Double red on the outside => Single Rotation
            else if(firstRedLeft) {
                    initiateStep(
                        'Red Alert - Right Rotate and Swap Colors',
                        `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling 
                        (${uncle.value > 0 ? uncle.value : "Null"}). Since ${baseRed.value} is on the outside, we right rotate the 
                        red chain up. Also swap colors of the parent and grandparent (${grandpa.value}).`,
                        baseRed.parent!,
                        makeNullNode(null),
                    );
                }
            else {
                initiateStep(
                    'Red Alert - Left Rotate and Swap Colors',
                    `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling 
                    (${uncle.value > 0 ? uncle.value : "Null"}). Since ${baseRed.value} is on the outside, we left rotate the 
                    red chain up. Also swap colors of the parent and grandparent (${grandpa.value}).`,
                    baseRed.parent!,
                    makeNullNode(null),
                );
            }
        }  
    }

    const handleLackOfBlack = (baseBlack : Node, siblingLeft: boolean) : void => {
        // Root cannot have a lack of black
        if(isRoot(baseBlack)) {
            initiateStep(
                'No Additional Action Required',
                `The new black node (highlighted) is the root, but the root cannot have insufficient black height.`, 
                makeNullNode(null),
                baseBlack
            );
            return;
        }
    
        const sibling : Node = siblingLeft ? baseBlack.parent!.left! : baseBlack.parent!.right!;
    
        // CASE 1: Red Sibling => Setup rotation to get black sibling
        if(sibling.isRed) {
            if(siblingLeft) {
                initiateStep(
                    'Lack of Black - Right Rotate and Swap Colors to Get Black Sibling',
                    `The new black node (highlighted) has a red sibling (${sibling.value}), we right rotate the sibling up 
                    to reach a simpler case (black sibling).`,
                    sibling,
                    baseBlack
                );
            }
            else {
                initiateStep(
                    'Lack of Black - Left Rotate and Swap Colors to Get Black Sibling',
                    `The new black node (highlighted) has a red sibling (${sibling.value}), we left rotate the 
                    sibling up and swap the colors of the sibling and its pre-rotation parent (${sibling.parent!.value})
                    to reach a simpler case (black sibling).`,      
                    sibling,
                    baseBlack
                );
            }
        }
    
        // CASE 2: Black Sibling 

        // First try to find a red child of sibling to rotate
        // One and done rotation (sibling and red are in same direction i.e. red is on the outside)
        else if(siblingLeft ? sibling.left!.isRed : sibling.right!.isRed) {
            if(siblingLeft) {
                initiateStep(
                    'Lack of Black - Right Rotate and Color New Children Black',
                    `The new black node (highlighted) has a black sibling (${sibling.value}) with a red child on the outside 
                    (${sibling.left!.value}). We right rotate the sibling up the tree. The sibling keeps the color
                    of its parent (${baseBlack.parent!.isRed ? "red" : "black"}), and its new children 
                    (${sibling.left!.value} and ${baseBlack.parent!.value}) are both colored black.`, 
                    sibling, 
                    baseBlack
                );
            }
            else {
                initiateStep(
                    'Lack of Black - Left Rotate and Color New Children Black',
                    `The new black node (highlighted) has a black sibling (${sibling.value}) with a red child on the outside
                    (${sibling.right!.value}). We right rotate the sibling up the tree. The sibling keeps the color
                    of its parent (${baseBlack.parent!.isRed ? "red" : "black"}), and its new children
                    (${sibling.right!.value} and ${baseBlack.parent!.value}) are both colored black.`,
                    sibling, 
                    baseBlack
                );
            }
        }
    
        // Setup rotation (sibling and red are in different direction i.e. red is on the inside)
        else if(siblingLeft ? sibling.right!.isRed : sibling.left!.isRed) {
            if(siblingLeft) {
                initiateStep(
                    'Lack of Black - Left Rotate and Swap Colors to Get Outside Red',
                    `The new black node (highlighted) has a black sibling (${sibling.value}) with a red child on the inside
                    (${sibling.right!.value}). We left rotate the sibling down and swap colors
                    of the sibling and the inside child to reach a simpler case (red child on the outside).`,
                    sibling.right!,
                    baseBlack,
                )
            }
            else {
                initiateStep(
                    'Lack of Black - Right Rotate and Swap Colors to Get Outside Red',
                    `The new black node (highlighted) has a black sibling (${sibling.value}) with a red child on the inside
                    (${sibling.left!.value}). We right rotate the sibling down and swap colors
                    of the sibling and the inside child to reach a simpler case (red child on the outside).`,
                    sibling.right!,
                    baseBlack,
                )
            }
        }
            
        // There are no red children of sibling => recolor sibling 
        // red and potentially move lack of black upwards
        else if(baseBlack.parent!.isRed) {
                initiateStep(
                    'Lack of Black - Swap Colors of Parent and Sibling',
                    `The new black node (highlighted) has a black sibling (${sibling.value}) with no red child. Since the parent
                    (${baseBlack.parent!.value}) is red, we swap the colors of the parent and the sibling.`,      
                    sibling, 
                    baseBlack
                );
            }
        else {
            initiateStep(
                'Lack of Black - Color Sibling Red and Move Up',
                `The new black node (highlighted) has a black sibling (${sibling.value}) with no red child. Since the parent
                (${baseBlack.parent!.value}) is black, we color the sibling red and move the LACK OF BLACK up to the parent.`,
                sibling, 
                baseBlack
            );
        }
    }

    // UI FUNCTIONS

    // The explanations reference the values, so the values should be shown if the explanations are shown
    const setShowExplanation = (e : ChangeEvent<HTMLInputElement>) : void => {
        setShowAlerts(e.currentTarget.checked);
        if(e.currentTarget.checked) {
            setShowValues(true);
        }
    }
    // This is the contrapositive case for the above
    const setShowVals = (e : ChangeEvent<HTMLInputElement>) : void => {
        setShowValues(e.currentTarget.checked);
        if(!e.currentTarget.checked) {
            setShowAlerts(false);
        }
    }

    // Make the user confirm that they want to reset the tree
    const confirmResetTree = () : void => {
        modals.openConfirmModal({
        title: 'Are you sure you want to reset the tree?',
        children: (
            <Text size="sm">
            This action will erase all the nodes in the tree.
            </Text>
        ),
        labels: { confirm: 'Confirm', cancel: 'Cancel' },
        onConfirm: () => {setRoot(makeNullNode(null)); setRerenders((prev) => prev + 1)},
        onCancel: () => {},
        });
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
        // If we reach a null node, this is the place to insert
        else if(isNullNode(current)) {
            current.value = val;
            current.isRed = true;
            current.left = makeNullNode(current);
            current.right = makeNullNode(current);
            handleRedAlert(current); // Initiate process to check for double red
            if(!showAlerts) {
                setRerenders((prev) => prev + 1);
            }   
        }
        // Recursively search for to spot to insert in the appropriate half
        else if(val < current.value) {
            insert(current.left!, val);
        }
        else {
            insert(current.right!, val);
        }
    }

    const del = (current: Node, val: number) : void => {
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
            let skipRerender : boolean = false;

            // No child => if red no issue, if black we have to fix the black height
            if(!hasLeftChild && !hasRightChild) {
                if(!current.isRed) {
                    const nullNode : Node = makeNullNode(null);
                    const ilc = isLeftChild(current);
                    transferParent(current, nullNode);   
                    handleLackOfBlack(nullNode, !ilc);
                }
                else {
                    initiateStep(
                        'Simply Remove the Red Node',
                        `The node we are removing (highlighted ${val}) is red, so no 
                        properties of the Red-Black Tree can be violated.`,
                        current,
                        current
                    );
                }
            }
            
            // One child => child is red => current is black => 
            // Remove current and replace it with its child, 
            // color it black so no lack of black
            else if(hasLeftChild && !hasRightChild) {
                initiateStep(
                    'Replace Parent with Red Child Turned Black',
                    `We are trying to remove the highlighted ${val} but it has one red child (${current.left!.value}),
                    so we need to have the child take the place and the color of the removed node.`,
                    current.left!,
                    current
                );
            }
            else if(!hasLeftChild && hasRightChild) {
                initiateStep(
                    'Replace Parent with Red Child Turned Black',
                    `We are trying to remove the highlighted ${val} but it has one red child (${current.right!.value}),
                    so we need to have the child take the place and the color of the removed node.`,
                    current.right!,
                    current
                );
            }

            // Two children => Copy value of predecessor into 
            // current node then delete the predecessor 
            else {
                initiateStep(
                    'Replace Value with In-Order Predecessor to Get One Child',
                    `We are trying to remove (${val}) but it has two children (${current.left!.value} and
                    ${current.right!.value}), so we need to find the largest value in the tree smaller than ${val},
                    put that value where ${val} is, and then delete the node that originally held that value.`,
                    current,
                    makeNullNode(null)
                );
                // Skip rerendering the tree if no explanation because this is a setup step. 
                skipRerender = true; 
            }

            if(!skipRerender && !showAlerts) {
                setRerenders((prev) => prev + 1);
            }
            
        }
        // Recursively search for to spot to delete in the appropriate half
        else if(val < current.value) {
            del(current.left!, val);
        }
        else {
            del(current.right!, val);
        }
    }

    // This method's job is to find a value that will make the 
    // node be inserted at the spot of the tapped null node (n)
    const insertWrapper = (n : Node, isLeft: boolean) : void => {
        if(isRoot(n)) {
            insert(root, Math.floor((MIN + MAX) / 2));
        }
        else {
            let maxi : number, mini : number;
            if(isLeft) {
                maxi = n.parent!.value;
                mini = orderHelper().inOrderPredecessor(maxi);
            }
            else {
                mini = n.parent!.value;
                maxi = orderHelper().inOrderSuccessor(mini);
            }
            insert(root, Math.floor((mini + maxi) / 2));
        }
    }

    const orderHelper = () => {
        const inOrder = (n : Node) : Node[] => {
            if(n.left === null || n.right === null) {
                return [];
            }
            const before = inOrder(n.left);
            const after = inOrder(n.right);
            return before.concat(n, after);
        }

        return ({
            inOrderPredecessor : (val : number) : number => {
                const io = inOrder(root);
                const index = io.findIndex((n : Node) => n.value === val)
                return (index === -1 || index === 0) ? MIN : io[index - 1].value;
            },

            inOrderSuccessor : (val : number) : number => {
                const io = inOrder(root);
                const index = io.findIndex((n : Node) => n.value === val)
                return (index === -1 || index === io.length - 1) ? MAX : io[index + 1].value;
            }
        })
    }

    const drawTree = (n : Node | null, left : boolean) : JSX.Element => {
        if(n === null) {
            return (
                <></>
            )
        }

        // Only show highlights during alerts, this is the only thing that references highlighting
        const showHighlight : boolean = n.highlighted !== undefined && n.highlighted && opened;

        const color : string = n.isRed ? "red" : "black";
        const style : { color: string } = showHighlight ? { color : 'gold' } : {color : 'white'}; // This is text color
        const content : number | string = showValues ? (n.value > 0 ? n.value : 'Null') : " ";

        // Click on null nodes to add, non-null nodes to remove that node
        const action : () => void = isNullNode(n) ? () => insertWrapper(n, left) : () => del(root, n.value); 

        return (
            <Stack align="center">
                {(!isNullNode(n) || showNulls || showHighlight) && (
                    <Button style={style} color={color} radius="xl" size="compact-md" onClick={action}>
                        {content}
                    </Button>
                )}
                <Group wrap="nowrap" align="flex-start">
                    {/* Recursively draw left and right subtrees */}
                    {drawTree(n.left, true)}
                    {drawTree(n.right, false)}
                </Group>
            </Stack>
        )
    }

    const handleClose = () : void => {
        close();
        resolveOperation(resolveAction, saveNode);
        setRerenders((prev) => prev + 1); // Make sure the tree rerenders
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
                        data-testid="insertInput"
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
                        data-testid="deleteInput"
                    />
                    <Button radius="xl" disabled={deleteVal === ""} onClick={() => {del(root, deleteVal as number); setDeleteVal("")}}>
                        Delete
                    </Button>
                </Stack>

                <Stack>
                    <Switch
                        checked={showAlerts}
                        onChange={setShowExplanation}
                        label="Explanation"
                        labelPosition="right"
                    />

                    <Switch
                        checked={showValues}
                        onChange={setShowVals}
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
            <Modal title={modalTitle} opened={opened} onClose={handleClose} >
                <Text size="sm">
                    {modalMessage}
                </Text>
            </Modal>
        </>
    )
}