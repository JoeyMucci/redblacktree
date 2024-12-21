'use client';

import { Button, Center, Group, Stack } from '@mantine/core';
import { useViewportSize } from '@mantine/hooks';
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

const makePlaceholderNode = () : Node => {
    return {value: MAX, isRed: false, left: null, right: null, parent: null};
}

const MAXLEVELS = 6;
const BUTTONSIZE = 40;
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


const handleRedAlert = (baseRed: Node) : void => {
    // Root is red => make it black
    if(isRoot(baseRed)) {
        baseRed.isRed = false;
        return;
    }

    // Stop if parent is not red (i.e. there is no double red)
    if(!baseRed.parent!.isRed) {
        return;
    }

    // Grandpa must exist since parent is red and all reds have parents
    const grandpa : Node = baseRed.parent!.parent!;
    const firstRedLeft : boolean = isLeftChild(baseRed.parent!);
    const uncle : Node = firstRedLeft ? grandpa.right! : grandpa.left!;

    // CASE 1: Red Uncle => Recolor parents, grandpa and move issue upwards
    if(uncle.isRed) {
        grandpa.isRed = true;
        uncle.isRed = false;
        baseRed.parent!.isRed = false;
        handleRedAlert(grandpa);
    }

    // CASE 2: Black Uncle => Rotate and make newRoot black, children of newRoot red
    else {
        const secondRedLeft: boolean = isLeftChild(baseRed);

        // Setup Rotation
        if(firstRedLeft !== secondRedLeft) {
            const nextDoubleRed : Node = baseRed.parent!;
            if(firstRedLeft) {
                leftRotate(baseRed);
            }
            else {
                rightRotate(baseRed);
            }
            handleRedAlert(nextDoubleRed);
        }

        // Single Rotation
        else {
            if(firstRedLeft) {
                rightRotate(baseRed.parent!);
            }
            else {
                leftRotate(baseRed.parent!);
            }
            baseRed.parent!.isRed = false;
            grandpa.isRed = true;
        }  
    }
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
    const [tree, setTree] = useState<Node[][]>([[root]]); 
    const { width } = useViewportSize();
    const gapmap : number[] = [];

    for(let i = 0; i < MAXLEVELS; i++) {
        const buttons = 2 ** i;
        const whiteSpace = width - BUTTONSIZE * buttons;
        gapmap.push(whiteSpace / (buttons) + 1);
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
            setTree(levelOrder(root));
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
        if(!n.parent) {
            insert(root, Math.floor((MIN + MAX) / 2))
        }
        else {
            let maxi : number, mini : number;
            if(isLeft) {
                maxi = n.parent.value;
                mini = inOrderPredecessor(maxi);
            }
            else {
                mini = n.parent.value;
                maxi = inOrderSuccessor(mini);
            }
            insert(root, Math.floor((mini + maxi) / 2))
        }
    }

    const remove = (current: Node, val: number) : void => {
        if(val <= MIN || val >= MAX) {
            // ERROR HANDLING
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
                setTree(levelOrder(root));
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

    const levelOrder = (n : Node) : Node[][] => {
        const ans : Node[][] = [];

        const q : [Node, number][] = [];

        let nodesAdded = 0;

        q.unshift([n, 0]);

        while(nodesAdded < 2 ** MAXLEVELS - 1) {
            const popped : [Node, number] = q[q.length - 1];
            q.pop()
            const pNode : Node = popped[0];
            const pRank : number = popped[1];

            if(pNode.left !== null && pNode.right !== null) {
                q.unshift([pNode.left, pRank + 1]);
                q.unshift([pNode.right, pRank + 1]);
            }
            else {
                q.unshift([makePlaceholderNode(), pRank + 1])
                q.unshift([makePlaceholderNode(), pRank + 1])
            }

            if(ans.length === pRank) {
                ans.push([]);
            }
            ans[pRank].push(pNode); 
            nodesAdded++;
        }

        return ans;
    }

    return (
        <Center>
            <Stack>
            {tree.map((nList : Node[], i : number) => { 
                return (
                        <Center key={i}>
                            <Group gap={gapmap[i]}>
                                {nList.map((n : Node, j : number) => { 
                                    // REGULAR NODE
                                    if(n.value > MIN && n.value < MAX) {
                                        return (
                                            <Button key={j} color={n.isRed ? "red" : "black"} size="compact-xs" onClick={() => remove(root, n.value)}>
                                                {n.value}
                                            </Button>
                                        )
                                    }

                                    // ADD NODE
                                    if(isNullNode(n)) {
                                        return (
                                            <Button key={j} color="gray" size="compact-xs" onClick={() => insertWrapper(n, j % 2 === 0)}>
                                                Add
                                            </Button>
                                        )
                                    }

                                    // PLACEHOLDER NODE
                                    return (
                                        <Button key={j} style={{visibility: 'hidden'}} size="compact-xs">
                                            Add
                                        </Button>
                                    )
                                })}
                            </Group>
                        </Center>
                )
            })}
            </Stack>
        </Center>
    )
}