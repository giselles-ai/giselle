# @giselle-ai/supabase-driver

## How to Use Supabase Vault Driver

Supabase Vault cannot be executed directly from the Supabase JavaScript SDK, so it needs to be executed via RPC.

Before using `./supabase-vault-driver.ts`, please execute the following SQL in the Supabase dashboard to create the necessary RPCs:

```sql
create or replace function create_secret(plaintext text) returns text as $$
  select vault.create_secret(plaintext);
$$ language sql;

create or replace function decrypt_secret(secret_id uuid) returns text as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where id = secret_id;
$$ language sql;
```
