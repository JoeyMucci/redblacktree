'use client';

import { useDisclosure } from '@mantine/hooks';
import { Button, Divider, Group, NumberInput, Stack, Switch, Modal, Text } from '@mantine/core';
import { useState } from 'react';

interface Node {
    value: number
    isRed: boolean
    left: Node | null
    right: Node | null
    parent: Node | null
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



const handleLackOfBlack = (baseBlack : Node, siblingLeft: boolean) : void => {
    // Root cannot have a lack of black
    if(isRoot(baseBlack)) {
        return;
    }

    const sibling : Node = siblingLeft ? baseBlack.parent!.left! : baseBlack.parent!.right!;

    // CASE 1: Red Sibling => Setup rotation to get black sibling
    if(sibling.isRed) {
        if(siblingLeft) {
            rightRotate(sibling);
        }
        else {
            leftRotate(sibling);
        }
        sibling.isRed = false;
        baseBlack.parent!.isRed = true;
        handleLackOfBlack(baseBlack, siblingLeft);
    }

    // CASE 2: Black Sibling 
    else {
        const rootIsRed : boolean = baseBlack.parent!.isRed;

        // First try to find a red child of sibling to rotate
        // One and done rotation (sibling and red are in same direction)
        if(siblingLeft ? sibling.left!.isRed : sibling.right!.isRed) {
            if(siblingLeft) {
                rightRotate(sibling);
            }
            else {
                leftRotate(sibling);
            }

            sibling.left!.isRed = false;
            sibling.right!.isRed = false;
            sibling.isRed = rootIsRed;
        }

        // Setup rotation (sibling and red are in different direction)
        else if(siblingLeft ? sibling.right!.isRed : sibling.left!.isRed) {
            if(siblingLeft) {
                leftRotate(sibling.right!);
            }
            else {
                rightRotate(sibling.left!);
            }

            sibling.isRed = true;
            sibling.parent!.isRed = false;
            handleLackOfBlack(baseBlack, siblingLeft);
        }
        
        // There are no red children of sibling => recolor sibling 
        // red and potentially move lack of black upwards
        else {
            sibling.isRed = true;
            if(rootIsRed) {
                baseBlack.parent!.isRed = false;
            }
            else {
                handleLackOfBlack(baseBlack.parent!, !isLeftChild(baseBlack.parent!));
            }
        }
    }
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

    const [cleanupAction, setCleanupAction] = useState<string>('NOTHING');
    const [saveNode, setSaveNode] = useState<Node>(makeNullNode(null));


    const handleClose = () : void => {
        close();
        doCleanupAction(cleanupAction, saveNode);
        setRerenders((prev) => prev + 1);
    }

    const doCleanupAction = (cleanAct : string, saveN : Node) : void => {
        if(cleanAct === 'TURN_ROOT_BLACK') {
            root.isRed = false;
        }
        else if(cleanAct === 'RECOLOR_RED_CHILDREN_BLACK_RECHECK') {
            saveN.isRed = true;
            saveN.left!.isRed = false;
            saveN.right!.isRed = false;
            handleRedAlert(saveN);
        }
        else if(cleanAct === 'SIMPLE_SETUP_ROTATION_LEFT') {
            leftRotate(saveN);
            handleRedAlert(saveN.left!);
        }
        else if(cleanAct === 'SIMPLE_SETUP_ROTATION_RIGHT') {
            rightRotate(saveN);
            handleRedAlert(saveN.right!);
        }
        else if(cleanAct === 'ROTATION_RIGHT_RED_CHILDREN') {
            rightRotate(saveN);
            saveN.right!.isRed = true;
            saveN.isRed = false;
        }
        else if(cleanAct === 'ROTATION_LEFT_RED_CHILDREN') {
            leftRotate(saveN);
            saveN.left!.isRed = true;
            saveN.isRed = false;
        }
    }

    const setupBreakpoint =  (msg : string, cleanAct: string, saveN : Node) : void => {
        if(showAlerts) {
            if(cleanAct === 'RECOLOR_RED_CHILDREN_BLACK_RECHECK' ||
                cleanAct === 'SIMPLE_SETUP_ROTATION_LEFT' ||
                cleanAct === 'SIMPLE_SETUP_ROTATION_RIGHT' ||
                cleanAct === 'ROTATION_RIGHT_RED_CHILDREN' ||
                cleanAct === 'ROTATION_LEFT_RED_CHILDREN'
            ) {
                setModalTitle("RED ALERT");
            }
            else {
                setModalTitle("Placeholder");
            }
            setModalMessage(msg);
            open();
            setCleanupAction(cleanAct);
            setSaveNode(saveN);
        } 
        else {
            doCleanupAction(cleanAct, saveN);
        }
    }

    const handleRedAlert =  (baseRed: Node) : void => {
        // Root is red => make it black
        if(isRoot(baseRed)) {
            setupBreakpoint(
                `The new red node (${baseRed.value}) is the root, we turn it back to black since the root is always black`,
                'TURN_ROOT_BLACK',
                makeNullNode(null)
            );
            return;
        }
    
        // Stop if parent is not red (i.e. there is no double red)
        if(!baseRed.parent!.isRed) {
            setupBreakpoint(
                `The new red node (${baseRed.value}) has a black parent (${baseRed.parent!.value}), no action is required`,
                'NOTHING',
                makeNullNode(null)
            );
            return;
        }
    
        // Grandpa must exist since parent is red and all reds have parents
        const grandpa : Node = baseRed.parent!.parent!;
        const firstRedLeft : boolean = isLeftChild(baseRed.parent!);
        const uncle : Node = firstRedLeft ? grandpa.right! : grandpa.left!;
    
        // CASE 1: Red Uncle => Recolor parents, grandpa and move issue upwards
        if(uncle.isRed) {
            setSaveNode(grandpa);
            setupBreakpoint(
                `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a red sibling (${uncle.value}), 
                    recolor the parent and its sibling black. Also, recolor the grandparent (${grandpa.value}) red and check for another RED ALERT`,
                'RECOLOR_RED_CHILDREN_BLACK_RECHECK',
                grandpa
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
                        Since the second red is on the inside, we rotate it to the outside with a left rotation and then apply the outside case.`,
                        'SIMPLE_SETUP_ROTATION_LEFT',
                        baseRed
                    );
                }
                else {
                    setupBreakpoint(
                        `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling (${uncle.value > 0 ? uncle.value : "Null"}).  
                        Since the second red is on the inside, we rotate it to the outside with a right rotation and then apply the outside case.`,
                        'SIMPLE_SETUP_ROTATION_RIGHT',
                        baseRed
                    );
                }
            }
    
            // Double red on the outside => Single Rotation
            else if(firstRedLeft) {
                    setupBreakpoint(
                        `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling (${uncle.value > 0 ? uncle.value : "Null"}).  
                        Since the second red is on the outside, we rotate the red chain up with a right rotation. The node going up a level (${baseRed.parent!.value}) turns from red to black and the node going down a level 
                        (${grandpa.value}) turns from black to red.`,
                        'ROTATION_RIGHT_RED_CHILDREN',
                        baseRed.parent!
                    );
                }
            else {
                setupBreakpoint(
                    `The new red node (${baseRed.value}) has a red parent (${baseRed.parent!.value}) with a black sibling (${uncle.value > 0 ? uncle.value : "Null"}).  
                    Since the second red is on the outside, we rotate the red chain up with a left rotation. The node going up a level (${baseRed.parent!.value}) turns from red to black and the node going down a level 
                    (${grandpa.value}) turns from black to red.`,
                    'ROTATION_LEFT_RED_CHILDREN',
                    baseRed.parent!
                );
            }
        }  
    }

    const insert = (current: Node, val: number) : void => {
        if(val <= MIN || val >= MAX || val === current.value) {
            // ERROR HANDLING
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
        if(val <= MIN || val >= MAX || !current) {
            // ERROR HANDLING - Trying to delete a value that does not exist
        }
        else if(current.value === val) {
            const hasLeftChild : boolean = !isNullNode(current.left!);
            const hasRightChild : boolean = !isNullNode(current.right!);
            let skipUpdate : boolean = false;

            if(!hasLeftChild && !hasRightChild) {
                const nullNode : Node = makeNullNode(null);
                const ilc = isLeftChild(current);
                transferParent(current, nullNode);   
                if(!current.isRed) {
                    handleLackOfBlack(nullNode, !ilc);
                }
            }

            // One child => child is red => current is black => 
            // Remove current and replace it with its child, 
            // color it black so no lack of black
            else if(hasLeftChild && !hasRightChild) {
                current.left!.isRed = false;
                transferParent(current, current.left!);
            }
            else if(!hasLeftChild && hasRightChild) {
                current.right!.isRed = false;
                transferParent(current, current.right!);
            }

            // Two children => Copy value of predecessor into 
            // current node then delete the predecessor 
            else {
                const iop = inOrderPredecessor(current.value);
                current.value = iop;
                remove(current.left!, iop);
                skipUpdate = true; // Do not update the tree (for now)
            }

            if(!skipUpdate) {
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
        return (
            <Stack align="center">
                {isNullNode(n) ? (
                    showNulls && (
                        showValues ? 
                            <Button color="black" radius="xl" size="compact-md" onClick={() => insertWrapper(n, left)}>
                                Null
                            </Button>
                        :
                            <Button color="black" radius="xl" onClick={() => insertWrapper(n, left)} /> 
                    )
                ) : (
                    showValues ? 
                        <Button color={n.isRed ? "red" : "black"} radius="xl" size="compact-md" onClick={() => remove(root, n.value)}>
                            {Math.floor(n.value * 100) / 100}
                        </Button>
                    :
                        <Button color={n.isRed ? "red" : "black"} radius="xl" onClick={() => remove(root, n.value)} /> 
                )}
                
                <Group wrap="nowrap" style={{overflowAnchor: "auto"}} align="flex-start">
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
            <Divider my="md" style={{width:'100%'}} color='white'/>
            {drawTree(root, false)} 
            <Modal opened={opened} onClose={handleClose} title={modalTitle}>
                {modalMessage}
            </Modal>
        </>
    )
}