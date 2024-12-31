import Image from 'next/image';
import Link from 'next/link';
import { Center, Text, Stack, Title, Divider, Group } from '@mantine/core';

export default function HomePage() {
  return (
    <>
      <Center>
          <Stack>
          <Image
              src="/favicon.png"
              width={425}
              height={425}
              alt="A GIF showing a delete when the sibling is red"
          />
          <Title>
              <Text
                component="span"
                inherit
                variant="gradient"
                gradient={{ from: 'red', to: 'black' }}
              >
                Red-Black
              </Text>{' '}
              Tree Lesson
            </Title>

            <br/>

            <Center>
              <Group gap="6px">
                <Text component ="span">
                  Learn Red-Black Trees hands-on by
                </Text>

                <Link href="/tree">
                  making one yourself
                </Link>
              </Group>
            </Center>

            <Divider label="or" labelPosition="center" color="white" />

            <Center>
              <Group gap="6px">
                <Link href="/learn">
                  Study the rules
                </Link>

                <Text component ="span">
                  to build a strong foundation
                </Text>
              </Group>
            </Center>
          </Stack>
      </Center>
    </>
  );
}
