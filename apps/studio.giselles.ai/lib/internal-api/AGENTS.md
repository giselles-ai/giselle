Files in this directory are executed as Server Actions in ServerRuntime.

If you want to get the currently signed-in user, run:
```ts
import { getCurrentUser } from "@/lib/get-current-user";

await getCurrentUser()
```

If you want to access the database, run:
```ts
import { acts, agents, db } from "@/db";

const agent = await db.query.agents.findFirst({
	where: (agents, { eq }) => eq(agents.workspaceId, workspaceId),
});
```
