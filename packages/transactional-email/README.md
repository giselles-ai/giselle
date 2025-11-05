# @giselles-ai/transactional-email

Email templates for Giselle using [React Email](https://react.email/).

## Getting Started

Install dependencies from the root:

```bash
pnpm install
```

## Development

Start the email preview server:

```bash
pnpm -F @giselles-ai/transactional-email dev
```

This opens a local preview server at `http://localhost:3333` where you can view and test email templates.

## Creating Templates

Add new email templates in the `emails/` directory. Example:

```tsx
import { Html, Head, Body, Container, Text } from '@react-email/components';

export const MyEmail = ({ name }: { name: string }) => {
  return (
    <Html>
      <Head />
      <Body>
        <Container>
          <Text>Hello {name}!</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default MyEmail;
```

## Exporting Templates

Export templates as static HTML:

```bash
pnpm -F @giselles-ai/transactional-email export
```

Output will be in the `out/` directory.

## Resources

- [React Email Documentation](https://react.email/docs/introduction)
- [React Email Components](https://react.email/docs/components/html)
