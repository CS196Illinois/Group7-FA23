import { useDisclosure } from '@mantine/hooks';
import { Card, Text, Modal, Title, Anchor, Badge, Button } from '@mantine/core';

function CourseCard({ name, description, subject, number, available_term }) {
    const [opened, { open, close }] = useDisclosure(false);
    const courseXML = 'https://courses.illinois.edu/cisapp/explorer/catalog/2024/spring/{subject}/{number}.xml'.replace('{subject}', subject).replace('{number}', number);
    const courseURL = 'https://courses.illinois.edu/search/schedule/2024/spring/{subject}/{number}'.replace('{subject}', subject).replace('{number}', number);
    const courseTermsOffered = "https://courses.illinois.edu/schedule/terms/{subject}/{number}".replace('{subject}', subject).replace('{number}', number);
    return (
        <>
        <Card shadow="lg" padding="lg" radius="md" m="lg" style={{overflow: "auto"}} withBorder>
            <Title order={4} c="white">
                {subject} {number}
            </Title>
            {available_term ? ( 
            <Anchor href={courseURL} target="_blank" underline="hover">
                <Title order={4} c="violet.3" mt="sm">
                    {name}
                </Title>
            </Anchor>) : 
                (
            <Anchor href={courseTermsOffered} target="_blank" underline="hover">
                <Title order={4} c="violet.3" mt="sm">
                {name}
                </Title>
            </Anchor>)
            }
            <Text size="sm" mt="sm" style={{textAlign: "left"}}>
                {description}
            </Text>
            {available_term && 
            <a href={courseURL} target="_blank">
            <Badge
            size="xl"
            fullWidth
            variant="gradient"
            mt="sm"
            radius="sm"
            gradient={{ from: 'orange', to: 'blue', deg: 145 }}
            >
                Available Spring 2024
            </Badge>
            </a>
            }
        </Card>
        </>
    );
}
/*
<a href={courseURL} target="_blank">
    <Title order={4} c="violet.3">
        {name}
    </Title>
</a>
*/

export default CourseCard; 


