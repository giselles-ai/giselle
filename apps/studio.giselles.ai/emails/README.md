# Email Templates

Email templates for Giselle using [React Email](https://react.email/).

## Development

Start the email preview server:

```bash
pnpm -F studio.giselles.ai email:dev
```

This opens a local preview server at `http://localhost:3333` where you can view and test email templates.

## Static Assets

- Store shared images in `apps/studio.giselles.ai/public/emails`. These files are served from `/emails/*` in production emails.
- The `emails/static` directory is a symlink to the public assets, so the React Email preview (`pnpm email:dev`) can continue to serve `/static/*` without duplicating files.
- Use `getEmailAssetUrl("<filename>")` from `emails/utils/email-assets.ts` to reference any asset. The helper automatically switches between `/static` for preview and `/emails` for production.

## Creating Templates

Add new email templates in this directory. Example:

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
pnpm -F studio.giselles.ai email:export
```

Output will be in the `out/` directory.

## Resources

- [React Email Documentation](https://react.email/docs/introduction)
- [React Email Components](https://react.email/docs/components/html)
