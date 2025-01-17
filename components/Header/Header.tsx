'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Container, Group, Button, Center } from '@mantine/core';
import classes from './Header.module.css';

export function Header() {
    const router = useRouter();
    return (
        <header className={classes.header}>
            <Container>
                <Center>
                    <Group>
                        <Button size="lg" onClick={() => {router.push('/')}} >
                            <Image
                                src="/favicon.png"
                                width={30}
                                height={30}
                                alt="A clip art Red-Black Tree which is the mascot"
                            />
                        </Button>

                        <Button size="lg" onClick={() => {router.push('/tree')}} >
                            Build Tree
                        </Button>

                        <Button size="lg" onClick={() => {router.push('/learn')}} >
                            Learn
                        </Button>
                    </Group>
                </Center>
            </Container>
        </header>
    )
}