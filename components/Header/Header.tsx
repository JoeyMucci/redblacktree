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
                        <Image
                            src="/favicon.png"
                            width={30}
                            height={30}
                            onClick={() => {router.push('/')}}
                            style={{ cursor: 'pointer' }}
                            alt="A pixel art Red-Black Tree which is the mascot"
                        />

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