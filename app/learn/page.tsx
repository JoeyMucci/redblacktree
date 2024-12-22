'use client';

import Image from 'next/image'
import Link from 'next/link'
import { Group, Button, Title, Stack, Text, Accordion } from '@mantine/core'


const rulesData = [
    {
        title: "Binary Search Tree Property",
        value: "1",
        description: "A Red-Black Tree is a Binary Search Tree",
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Node Color Property",
        description: "Every node in the tree is either red or black",
        value: "2",
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Root Color Property",
        description: "The root of the tree is black",
        value: "3",
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Double Red Property",
        description: "A red node cannot have another red node as a child",
        value: "4",
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Black Height Property",
        description: "Every path to an external node has the same amount of black internal nodes",
        value: "5",
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
    {
        title: "Null Node Property (Explanation of Above)",
        description: "Every external node is null node colored black (not typically shown)",
        value: "6",
        alt: "An aspiring Red-Black Tree that  does not satisfy all properties"
    },
]

export default function Learn() {


    return (
        <>
            <Stack align="center" justify="center">
                <Title order={1}>Learn Red-Black Trees</Title>
                <Group>
                    <Button component={Link} href="#bst">
                        BST Background
                    </Button>
                    <Button component={Link} href="#rules">
                        Red-Black Rules
                    </Button>
                    <Button component={Link} href="#why">
                        Why Red-Black?
                    </Button>
                    <Button component={Link} href="#insert">
                        How to Insert
                    </Button>
                    <Button component={Link} href="#delete">
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
                {/* <List>
                    {rulesData.map((rule) => (
                        <List.Item key={rule.value}>{rule.description}</List.Item>
                    ))}
                </List> */}

                <Accordion style={{width: 450}}>
                    {rulesData.map((rule) => (
                        <Accordion.Item key={rule.value} value={rule.value}>
                            <Accordion.Control>{rule.title}</Accordion.Control>
                            <Accordion.Panel>
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