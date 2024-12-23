'use client';

import Image from 'next/image'
import { useScrollIntoView } from '@mantine/hooks';
import { Group, Button, Title, Stack, Text, Accordion } from '@mantine/core'

interface Rule {
    title: string
    statement: string
    description: string
    value: number
    alt: string
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
        description: `At first glance it looks like all paths to an external node have one internal black node. But in fact there is one path with 
        one black internal node and other paths with two black internal nodes. The Null Node Property explains the problem here in more detail.`,
        value: 5,
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Null Node Property",
        statement: "Every external node is a null node colored black (not typically shown)",
        description: `So, every red node must have two black children that are either both null or both not null, otherwise the black 
        height property would be violated. Since this tree has a red node with only one non-null child it is not a Red-Black Tree`,
        value: 6,
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
]

export default function Learn() {
    const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>();


    const scrollButton = (newRef : HTMLDivElement) : void => {
        targetRef.current = newRef;
        scrollIntoView({ alignment: 'start' })
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
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <Title order={2} id="bst">Binary Search Tree Prerequisites</Title>

                <Title order={2} id="rules">Red-Black Tree Rules</Title>
                <Accordion style={{width: 450}}>
                    {rulesData.map((rule) => (
                        <Accordion.Item key={rule.value} value={rule.value.toString()}>
                            <Accordion.Control>{rule.title}</Accordion.Control>
                            <Accordion.Panel>
                                <Text fw={700}>{rule.statement}</Text>
                                <Text>{rule.description}</Text>
                                <Image
                                    src={`/rbimages/rule${rule.value}.png`}
                                    width={425}
                                    height={575}
                                    alt={rule.alt}
                                />
                            </Accordion.Panel>
                        </Accordion.Item>
                    ))}
                </Accordion>

                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />

                <Title order={2} id="why">Advantages of Red-Black Tree</Title>


                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />

                <Title order={2} id="insert">Insert Operation in Red-Black Tree</Title>

                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <br />
                <Title order={2} id="delete">Delete Operation in Red-Black Tree</Title>
            </Stack>
        </>
    )
}