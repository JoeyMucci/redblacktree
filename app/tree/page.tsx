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

const makePlaceholderNode = () : Node => {
    return {value: MAX, isRed: false, left: null, right: null, parent: null};
}

const MAXLEVELS = 6;
const BUTTONSIZE = 40;
let root : Node = makeNullNode(null);

const assignLeftChild = (parent: Node, child : Node) : void => {
    parent.left = child;
    child.parent = parent;
}

const assignRightChild = (parent: Node, child : Node) : void => {
    parent.right = child;
    child.parent = parent;
}

const exchangeChildren = (oldChild: Node, newChild: Node) : void => {
    if(!oldChild.parent) {
        root = newChild;
        newChild.parent = null;
        return;
    }

    const isLeft : boolean = oldChild.parent.left!.value === oldChild.value;

    if(isLeft) {
        assignLeftChild(oldChild.parent, newChild);
    }
    else {
        assignRightChild(oldChild.parent, newChild);
    }
}

// The newRoot for a rotation will never be the old root or a null node
const rightRotate = (newRoot : Node) : void => {
    const par = newRoot.parent!;
    exchangeChildren(par, newRoot);
    assignLeftChild(par, newRoot.right!);
    assignRightChild(newRoot, par);
}

const leftRotate = (newRoot : Node) : void => {
    const par = newRoot.parent!;
    exchangeChildren(par, newRoot);
    assignRightChild(par, newRoot.left!);
    assignLeftChild(newRoot, par);
}


const correctDoubleRed = (baseRed: Node) : void => {
    // Root is red => make it black
    if(!baseRed.parent) {
        baseRed.isRed = false;
        return;
    }

    // Stop if parent is not red (i.e. there is no double red)
    if(!baseRed.parent.isRed) {
        return;
    }

    // Grandpa must exist since parent is red and all reds have parents
    const grandpa : Node = baseRed.parent.parent!;
    const firstRedLeft : boolean = grandpa.value > baseRed.parent.value;
    const uncle : Node = firstRedLeft ? grandpa.right! : grandpa.left!;

    // CASE 1: Red Uncle => Recolor parents, grandpa and move issue upwards
    if(uncle.isRed) {
        grandpa.isRed = true;
        uncle.isRed = false;
        baseRed.parent.isRed = false;
        correctDoubleRed(grandpa);
    }

    // CASE 2: Black Uncle => Rotate and make newRoot black, children of newRoot red
    else {
        const secondRedLeft: boolean = baseRed.parent.value > baseRed.value;

        // Setup Rotation
        if(firstRedLeft !== secondRedLeft) {
            const nextDoubleRed : Node = baseRed.parent;
            if(firstRedLeft) {
                leftRotate(baseRed);
            }
            else {
                rightRotate(baseRed);
            }
            correctDoubleRed(nextDoubleRed);
        }

        // Single Rotation
        else {
            if(firstRedLeft) {
                rightRotate(baseRed.parent);
            }
            else {
                leftRotate(baseRed.parent);
            }
            baseRed.parent.isRed = false;
            grandpa.isRed = true;
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
        else if(current.left === null || current.right === null) {
            current.value = val;
            current.isRed = true;
            current.left = makeNullNode(current);
            current.right = makeNullNode(current);
            correctDoubleRed(current);
            setTree(levelOrder(root));
        }
        else if(val < current.value) {
            insert(current.left, val);
        }
        else {
            insert(current.right, val);
        }
    }

    // This method's job is to find a value that will make the 
    // node be inserted where tapped and then call insert
    const insertWrapper = (n : Node, isLeft: boolean) : void => {
        if(!n.parent) {
            insert(root, Math.floor((MIN + MAX) / 2))
        }
        else {
            const io = inOrder(root);
            let maxi : number, mini : number;
            if(isLeft) {
                maxi = n.parent.value;
                const index = io.findIndex((nod : Node) => nod.value === maxi)
                mini = index === 0 ? MIN : io[index - 1].value;
            }
            else {
                mini = n.parent.value;
                const index = io.findIndex((nod : Node) => nod.value === mini)
                maxi = index === io.length - 1 ? MAX : io[index + 1].value;
            }
            insert(root, Math.floor((mini + maxi) / 2))
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
                                            <Button key={j} color={n.isRed ? "red" : "black"} size="compact-xs">
                                                {n.value}
                                            </Button>
                                        )
                                    }

                                    // ADD NODE
                                    if(n.value <= MIN) {
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