'use client';

import Image from 'next/image'
import { useScrollIntoView, useViewportSize } from '@mantine/hooks';
import { Group, Button, Title, Stack, Text, Accordion, List, Collapse, Divider } from '@mantine/core'
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Rule {
    title: string
    statement: string
    description: string
    value: number
    alt: string
}

interface CompCheck {
    question: string
    answer: string
    showq: boolean
}

const rulesData : Rule[] = [
    {
        title: "Binary Search Tree Property",
        statement: "A Red-Black Tree is a Binary Search Tree",
        description: "So this is not a Red-Black Tree because the values are not in order, as they would be in a BST",
        value: 1,      
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Node Color Property",
        statement: "Every node in the tree is either red or black",
        description: `So this is not a Red-Black Tree because there is a magenta node. We should have known a magenta-colored
        node was not gonna fly in a Red-Black Tree, I mean it's in the name`,
        value: 2,
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Root Color Property",
        statement: "The root of the tree is black",
        description: "So this is not a Red-Black Tree because the root is red",
        value: 3,
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Double Red Property",
        statement: "A red node cannot have a red node as a child",
        description: "So this is not a Red-Black Tree since there is a \"double red\"",
        value: 4,
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Black Height Property",
        statement: "Every path to an external node has the same amount of black internal nodes",
        description: `At first glance it looks like all paths to an external node have one internal black node. But in fact
        there is one path with one black internal node and other paths with two black internal nodes. The Null Node Property
        explains the problem here in more detail.`,
        value: 5,
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Null Node Property",
        statement: "Every external node is a null node colored black (not typically shown)",
        description: `We have to be careful when considering the different paths for the Black Height Property. A consequence of
        the Null Node Property is that every node must have two black children that are either both null or both not null, otherwise 
        the black height property would be violated. In this example, we see that the sole red node has one null child and one non-null
        child, which in turn violates the Black Height Property. Therefore, this is not a Red-Black Tree.`,
        value: 6,
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
]

const bstQA : CompCheck[] = [
    {
        question: "What is the value of 79's parent?",
        answer: "66",
        showq: false,
    },
    {
        question: "How many nodes are at level 3?",
        answer: "1 (25)",
        showq: false,
    },
    {
        question: "How many leaf nodes are there?",
        answer: "4 (70, 7, 25, 58)",
        showq: false,
    },
]

export default function Learn() {
    const router = useRouter();
    const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>();
    const { width } = useViewportSize();
    const textWidth = Math.min(width - 25, 450);
    const [showBstA, setshowBstA] = useState<boolean[]>(new Array(bstQA.length).fill(false));

    const scrollButton = (newRef : HTMLDivElement) : void => {
        targetRef.current = newRef;
        scrollIntoView({ alignment: 'start' });
    }

    const updateshowBstA = (index : number) : void => {
        const copy = [...showBstA];
        copy[index] = !copy[index];
        setshowBstA(copy);
    }

    return (
        <>
            <Stack align="center" justify="center">
                <Title order={1}>Learn Red-Black Trees</Title>
                <Group>
                    <Button onClick={() => scrollButton(document.getElementById("bst") as HTMLDivElement)}>
                        BST Background
                    </Button>
                    <Button onClick={() => scrollButton(document.getElementById("rules") as HTMLDivElement)}>
                        Red-Black Rules
                    </Button>
                    <Button onClick={() => scrollButton(document.getElementById("why") as HTMLDivElement)}>
                        Why Red-Black?
                    </Button>
                    <Button onClick={() => scrollButton(document.getElementById("insert") as HTMLDivElement)}>
                        How to Insert
                    </Button>
                    <Button onClick={() => scrollButton(document.getElementById("delete") as HTMLDivElement)}>
                        How to Delete
                    </Button>
                </Group>

                <Divider my="md" style={{width:'100%'}} color='white'/>

                <Title order={2} id="bst">Binary Search Tree Prerequisites</Title>

                <Text style={{width : textWidth}}>
                    Prior to understanding Red-Black Trees, one must understand Binary Search Trees generally. If you
                    already have a working understanding of BSTs, then you can skip this section. 
                </Text>

                <Text style={{width : textWidth}}>
                    First some vocabulary...
                </Text>

                <List>
                    <List.Item>Node - A part of the tree that holds a value</List.Item>
                    <List.Item>Root - The first/highest node in the tree</List.Item>
                    <List.Item>Child - A node that can be accessed from its parent</List.Item>
                    <List.Item>Siblings - Nodes that have the same parent</List.Item>
                    <List.Item>Parent - A node that "points" to its children</List.Item>
                    <List.Item>Grandparent - A child's parent's parent</List.Item>
                    <List.Item>Leaf/External Node - A node that has no children </List.Item>
                    <List.Item>Internal Node - A node that has children </List.Item>
                    <List.Item>Height - Length of longest path from root to leaf</List.Item>
                    <List.Item>Level - How far a node is removed from the root</List.Item>
                </List>

                <Image
                    src="/general/tree.png"
                    width={textWidth - 25}
                    height={textWidth - 25}
                    alt="A standard tree data structure"
                />

                <Group>
                    {bstQA.map((qa, i) => (
                        <div key={i}>
                            <Button key={i} onClick={() => updateshowBstA(i)}>
                                {qa.question}
                            </Button>

                            <Collapse in={showBstA && showBstA[i]} transitionDuration={300} transitionTimingFunction="linear">
                                <Text ta="center">{qa.answer}</Text>
                            </Collapse>
                        </div>
                    ))}
                </Group>

                <Divider my="md" style={{width:'50%'}} color='white'/>

                <Text style={{width : textWidth}}>
                    The big thing with trees is that there is no way to have a cycle, which is when you navigate to the same 
                    node more than once during a traversal. Such an occurrence is impossible because you are only able to move
                    down the tree (i.e. parent to child).
                </Text>

                <Text style={{width : textWidth}}>
                    For a tree to be a binary search tree, we must have that...
                </Text>

                <List>
                    <List.Item>Every node has at most two children, a left and a right</List.Item>
                    <List.Item>Any left child must hold a value less than its parent</List.Item>
                    <List.Item>Any right child must hold a value greater than its parent</List.Item>
                    <List.Item>Every value is unique</List.Item>
                </List>

                <Text style={{width : textWidth}}>
                    Let's put it all together with an example of a BST!
                </Text>

                <Image
                    src="/general/bst.png"
                    width={textWidth - 25}
                    height={textWidth - 25}
                    alt="An example of a binary search tree"
                />
                
                <Text style={{width : textWidth}}>
                    Finally we need to learn how to search, insert, and delete.
                </Text>

                <Text style={{width : textWidth}}>
                    To search we compare the value we are looking for to the value at the current node. 
                    If it is less, we then <strong>recursively</strong> search from the left child. If it is 
                    greater, we search from the right child. Search ends when we have an exact match (found), 
                    or when the next child we need to search is null (i.e. does not exist). This result means
                    that the value we are looking for is not in the binary search tree. 
                </Text>

                <Text style={{width : textWidth}}>
                    Insertion is very similar to search. First, call the search function. If the value we want
                    to insert is found, then we should do nothing or return an error. Recall that the values in
                    a BST must be unique. If the value is not found, we create a node with the new value at the 
                    location of the child that was null. 
                </Text>

                <Text style={{width : textWidth}}>
                    Delete is slightly more complicated. First, we search for the node with the value we want to
                    delete. If it has no children, we can delete it with no consequences. If it has one child, 
                    we delete it and have its child take its place. But if it has two children, we have to find 
                    the largest value smaller than the deleted value and swap the two. Then we can delete the node
                    with the swapped value because it must not have two children. It could not have a right child since
                    otherwise it would not be the largest value smaller than the deleted value. 
                </Text>

                <Text style={{width : textWidth}}>
                    Suppose we want to delete 66 from the BST example from earlier. First, we would swap its value
                    with the largest value less than it, which is 58. 
                </Text>

                <Image
                    src="/delete/step1.png"
                    width={textWidth - 25}
                    height={textWidth - 25}
                    alt="An example of a binary search tree"
                />

                <Text style={{width : textWidth}}>
                    Now since 66 only has one child, we can simply delete it and have it be replaced by its child, 25. 
                </Text>

                <Image
                    src="/delete/step2.png"
                    width={textWidth - 25}
                    height={textWidth - 25}
                    alt="An example of a binary search tree"
                />

                <Text style={{width : textWidth}}>
                    The result is a proper BST without 66!
                </Text>


                <Divider my="md" style={{width:'100%'}} color='white'/>

                <Title order={2} id="rules">Red-Black Tree Rules</Title>
                <Accordion style={{width : textWidth}}>
                    {rulesData.map((rule) => (
                        <Accordion.Item key={rule.value} value={rule.value.toString()}>
                            <Accordion.Control>{rule.title}</Accordion.Control>
                            <Accordion.Panel>
                                <Text fw={700}>{rule.statement}</Text>
                                <Text>{rule.description}</Text>
                                <Image
                                    src={`/rbimages/rule${rule.value}.png`}
                                    width={textWidth - 25}
                                    height={Math.floor((textWidth - 25) * 575 / 425)}
                                    alt={rule.alt}
                                />
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>

                <Divider my="md" style={{width:'100%'}} color='white'/>

                <Title order={2} id="why">Advantages of Red-Black Tree</Title>

                <Text style={{width : textWidth}}>
                    Binary Search Trees are great because, on average, we can search, insert, and delete in <code>O(logn)</code>{" "}
                    time, which is considerably faster than <code>O(n)</code> time. 
                </Text>

                <Text style={{width : textWidth}}>
                    The catch, however, is that word <i>average</i>. In the worst case, binary search trees still take
                    <code>O(n)</code>{" "} time for those three critical operations. Consider the following example...
                </Text>

                <Image
                    src="/general/lopsided.png"
                    width={textWidth - 25}
                    height={Math.floor((textWidth - 25) * 850 / 425)}
                    alt="An example of a lopsided binary search tree"
                />

                <Text style={{width : textWidth}}>
                    Since all the nodes are on one side of the tree, one must visit all the nodes to search, insert, and delete. 
                    And while this may seem like a contrived example incredibly unlikely to occur in practice, this scenario is
                    exactly what will happen if a list of elements already sorted gets put into a BST. 
                </Text>

                <Text style={{width : textWidth}}>
                    Thankfully, Red-Black Trees offer a solution. The properties mentioned above force the tree to
                    remain relatively{" "}<i>balanced</i>. Taken together, the Double Red property and the Black Height property 
                    guarantee that the longest path in the tree is no longer than twice the length of the shortest path in the tree. 
                    This is easy to see because the shortest path will consist of a certain amount of black nodes and any other path 
                    must consist of the same amount of black nodes (by the Black Height Property) and at most the same number of red nodes 
                    (if there were more red nodes than black nodes the Double Red Property would have to be violated). The end result is that 
                    the tree height is always{" "}<code>O(logn)</code> instead of <code>O(n)</code>, which means that the three crucial 
                    operations can be done in <code>O(logn)</code> time!
                </Text>

                <Text style={{width : textWidth}}>
                    Of course, any operation that changes the tree could jeopardize those properties
                    that help us achieve balance. As such, we will need to put in some extra work when 
                    inserting and deleting to make sure the tree still satisfies the Red-Black Properties. 
                </Text>

                <Divider my="md" style={{width:'100%'}} color='white'/>

                <Title order={2} id="insert">Insert Operation in Red-Black Tree</Title>
                    <Text style={{width : textWidth}}>
                        When we insert a node, we always let it be red to start. If its parent is black, we have not violated
                        any properties and we are done (yipee). However, if we insert a red node and its parent is red, we have just 
                        violated the Double Red Property, triggering what I like to call a <span style={{color : "red"}}>RED ALERT</span>.
                    </Text>

                    <Text style={{width : textWidth}}>
                        Here is a diagram showing the general logic to insert and resolve a <span style={{color : "red"}}>RED ALERT</span>. Some
                        of the instructions may be unclear at this stage but we will visit each in turn. 
                    </Text>

                    <Image
                        src="/insert/insert.png"
                        width={textWidth - 25}
                        height={textWidth - 25}
                        alt="A flow chart showing the logic to insert into a Red-Black Tree"
                    />

                    <Divider my="md" style={{width:'50%'}} color='white'/>

                    <Title order={3}>Parent's sibling is red</Title>
                        <Text style={{width : textWidth}}>
                            When the parent's sibling is red, change the color of the parent and its sibling to black. Then, change the color
                            of the grandparent to red. Now, the grandparent being changed to red could trigger another
                            {" "}<span style={{color : "red"}}>RED ALERT</span>{" "}higher up the tree, which could be this case again or a different 
                            case. Also, if the root is colored red this way it should instantly be changed back to black due to the Root Color
                            Property. Since every time the issue recurs closer to the root, there could only be <code>O(logn)</code> redos.
                            Thus, the overall time complexity for insert is still <code>O(logn)</code>.
                        </Text>

                        <Image
                            src="/insert/insert_red_sibling.gif"
                            unoptimized
                            width={textWidth - 25}
                            height={textWidth - 25}
                            alt="A GIF showing an insert when the parent and its sibling are red"
                        />

                    <Divider my="md" style={{width:'50%'}} color='white'/>

                    <Title order={3}>Parent's sibling is black</Title>
                        <Text style={{width : textWidth}}>
                            When the parent's sibling is black, we need to do something called a rotation. Rotations can be left or
                            right, and there are technically two types. However, a type 2 left rotation is just a right rotation
                            followed by a left rotation, and vice versa. For this reason, this tutorial will only teach the type 1 rotation,
                            since that is the only that strictly needs to be learned. Of course, if you already know the two rotation types 
                            from say, AVL trees, then you need not shift your way of thinking to ultimately understand Red-Black trees. 
                        </Text>

                        <Text style={{width : textWidth}}>
                            A rotation is a reshuffling of the nodes that maintains the BST property of being in order while changing 
                            the lengths of different paths in some desirable manner. It is easiest to understand rotations by seeing them 
                            in action but essentially the node you are rotating around goes down one level in the tree while its right child
                            (in the case of a left rotation), goes up one level. The trickiest part is what to do with the the grandchild of 
                            the node being rotated around that is one the "inside". We need to change the parent of that node to its previous 
                            grandparent. Pay attention to the node labeled 25 in the following diagram to better understand. 
                        </Text>

                        <Image
                            src="/general/rotation.gif"
                            unoptimized
                            width={textWidth - 25}
                            height={textWidth - 25}
                            alt="A GIF showing an insert when the parent and its sibling are red"
                        />

                        <Text style={{width : textWidth}}>
                            Now, for the actual Red-Black Tree rotation. If the red causing the <span style={{color : "red"}}>RED ALERT</span>{" "}
                            is on the inside, then we first do a rotation around the parent to make it so the double red is on the outside.
                            In other words, we are reducing the issue to a simpler case. If the red is on the outside, either from the start or
                            because we just set it up, we do a rotation around the original grandparent in the direction that brings the red chain
                            higher up the tree. After this rotation and this rotation only, color the node that is now in the grandparent spot black
                            and ensure both of its children are red. Again, visuals help immensely, so study the following diagram
                            that shows the worst case scenario. 
                        </Text>


                        <Image
                            src="/insert/insert_black_sibling.gif"
                            unoptimized
                            width={textWidth - 25}
                            height={textWidth - 25}
                            alt="A GIF showing an insert when the parent is red and its sibling is black"
                        />

                        <Text style={{width : textWidth}}>
                            P.S. - If you are wondering why the second red node in the example has two black children when presumably we 
                            just inserted it, recall that it is possible for a <span style={{color : "red"}}>RED ALERT</span> to occur on a
                            node higher up in the tree. This result occurs when the parent's sibling is red and coloring the grandparent red
                            caused another problem since its parent was also red. So while in many scenarios the issue will be at the bottom
                            of the tree, keep in mind that issues can really occur at any part of the tree due to the rolling up of errors. 
                        </Text>

                    <Divider my="md" style={{width:'50%'}} color='white'/>
                    
                    <Title order={3}>But the Parent Has No Sibling?</Title>
                        <Text style={{width : textWidth}}>
                            Recall due to the Null Node Property that every external node is a null node colored black, even if it is not shown.
                            So, if it <i>looks</i> like the parent has no sibling, it really just means the sibling is a black external null
                            node, so the black sibling case applies.  
                        </Text>
    
                <Divider my="md" style={{width:'100%'}} color='white'/>    

                <Title order={2} id="delete">Delete Operation in Red-Black Tree</Title>
                    <Text style={{width : textWidth}}>
                        The process for deleting a node is follows the same base rules as for a BST. If the color of the node we actually
                        end up removing is red, then no additional action is required. And if the node is black with
                        one red child, then all we need to do is delete, replace with the child as normal, and color it black. Otherwise, we will 
                        have an issue where the Black Height Property is violated and one subtree has a smaller black height than necessary. I like 
                        to call this scenario a <span style={{color : "white"}}>LACK OF BLACK</span>. 
                    </Text>

                    <Text style={{width : textWidth}}>
                        Here is a diagram showing the general logic to delete and resolve a <span style={{color : "white"}}>LACK OF BLACK</span>.
                        Some of the instructions may be unclear at this stage but we will visit each in turn. Note that the node in question is a
                        <i>problematic</i> black node with an insufficient black height that is the root of a subtree with insufficient black height.
                        Initially, this is the deleted node, but, like insert, the problem may roll up the tree
                        so that the problematic node is not the one being deleted. 
                    </Text>

                    <Image
                        src="/delete/delete.png"
                        width={textWidth - 25}
                        height={textWidth - 25}
                        alt="A flow chart showing the logic to delete from a Red-Black Tree"
                    />

                    <Divider my="md" style={{width:'50%'}} color='white'/>

                    <Title order={3}>Sibling is red</Title>
                        <Text style={{width : textWidth}}>
                            When the sibling of the problematic node is red, we have no recourse but to manipulate the situation so that the
                            sibling is black. We do this by a rotation around the parent that moves the problematic node downwards. For more 
                            explanation on how rotations are done refer to the insert section. After the rotation, recolor the node that rotated
                            down red and the node the got rotated up black. Once all rotating and recoloring is done, the problem will be reduced
                            to another case that we will be able to deal with more directly. 
                        </Text>

                        <Image
                            src="/delete/delete_red_sibling.gif"
                            unoptimized
                            width={textWidth - 25}
                            height={textWidth - 25}
                            alt="A GIF showing a delete when the sibling is red"
                        />

                    <Divider my="md" style={{width:'50%'}} color='white'/>

                    <Title order={3}>Sibling is black with a red child</Title>
                        <Text style={{width : textWidth}}>
                            This case is quite similar to insert with the parent's sibling being black. We need to rotate
                            to resolve the <span style={{color : "white"}}>LACK OF BLACK</span>. We need to do a setup rotation to get 
                            the red child on the outside if initially there is only a red child on the inside. After the setup rotation the 
                            red does need to get "passed through" like in the red sibling case. When the final rotation is done, we need to
                            ensure that the root of the rotated subtree is the same color as it was before, and that its children are both
                            black. The worst case scenario is demonstrated below, note the similarities to the insertion case. 
                        </Text>

                        <Image
                            src="/delete/delete_black_sibling_w_red_child.gif"
                            unoptimized
                            width={textWidth - 25}
                            height={textWidth - 25}
                            alt="A GIF showing a delete when the sibling is black with a red child"
                        />

                    <Divider my="md" style={{width:'50%'}} color='white'/>

                    <Title order={3}>Sibling is black with no red child</Title>
                        <Text style={{width : textWidth}}>
                            This case is reminiscent of the insert case where the parent's sibling is red in that it is a recoloring
                            with the potential for the issue, whether <span style={{color : "white"}}>LACK OF BLACK</span> or
                            {" "}<span style={{color : "red"}}>RED ALERT</span>{", "}to propogate upwards. No matter what, we color the sibling red.
                            Then, if the parent is red, we can color it black and be done. Otherwise, the parent becomes the
                            problematic node since its black height is too small. However, similar to insert, we have made progress, since
                            the problem now occurs higher up in the tree. Keep in mind that the root cannot have insufficient black height,
                            since it does need to match any subtrees. Since there are only <code>O(logn)</code> levels,
                            the time complexity of delete is still <code>O(logn)</code>.
                        </Text>

                        <Text style={{width : textWidth}}>
                            In the following tree, the black heights of the node are included. This is because it is helpful to consider
                            the nodes as the root of a subtree. If a node's subtree has a smaller black height than its sibling, then
                            clearly it has a <span style={{color : "white"}}>LACK OF BLACK</span>{", "}and we must go through the protocol
                            to resolve it. As mentioned above, when the parent is red, we can resolve all issues with a simple recoloring
                            of the sibling to red and the parent to black.
                        </Text>


                        <Image
                            src="/delete/delete_black_sibling_red_parent.gif"
                            unoptimized
                            width={textWidth - 25}
                            height={textWidth - 25}
                            alt="A GIF showing a delete when the parent is red and the sibling is black without a red child"
                        />

                        <Text style={{width : textWidth}}>
                            However, in the case where the parent is black, the <span style={{color : "white"}}>LACK OF BLACK</span> persists
                            at a higher level in the tree and must be resolved according to whichever case now applies. 
                        </Text>
                        
                        <Image
                            src="/delete/delete_black_sibling_black_parent.gif"
                            unoptimized
                            width={textWidth - 25}
                            height={textWidth - 25}
                            alt="A GIF showing a delete when the parent is black and the sibling is black without a red child"
                        />

                        <Divider my="md" style={{width:'50%'}} color='white'/>

                        <Text style={{width : textWidth}}>
                            And that is all you need to know about how Red-Black Trees operate! There is a lot to remember, which is why I
                            recommend trying it out for yourself by clicking the button below. You can build your own Red-Black Trees, and
                            get detailed explanations about each addition and deletion as it happens. The explanations follow the terminology
                            here, so having gone through this page should be helpful in understanding what's going on. And even if you just
                            skipped to the end, trying something out for yourself is still a great way to learn!
                        </Text>

                        <Button onClick={() => router.push('/tree')}>
                            Try It Yourself!
                        </Button>

                        <br/>
                        <br/>
            </Stack>
        </>
    )
}