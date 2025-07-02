import type { VaultDriver } from "@giselle-sdk/giselle-engine";
import { createClient } from "@supabase/supabase-js";

interface SupabaseVaultDriverConfig {
	url: string;
	serviceKey: string;
}

/**
 * Creates a Supabase-based vault driver
 * Uses Supabase Vault extension for storing encrypted secrets
 */
export function supabaseVaultDriver(
	config: SupabaseVaultDriverConfig,
): VaultDriver {
	const { url, serviceKey } = config;

	// Initialize Supabase client
	const supabase = createClient(url, serviceKey);

	return {
		async encrypt(plaintext, _options): Promise<string> {
			// Create a secret in the Supabase Vault
			const { data, error } = await supabase.rpc("create_secret", {
				plaintext,
			});

			if (error) {
				throw new Error(`Failed to store secret in Vault: ${error.message}`);
			}

			// Return the UUID of the created secret
			return data;
		},

		async decrypt(secretId: string): Promise<string> {
			// Query the decrypted_secrets view to get the plaintext
			const { data, error } = await supabase.rpc("decrypt_secret", {
				secret_id: secretId,
			});
			if (error) {
				throw new Error(
					`Failed to retrieve secret from Vault: ${error.message}`,
				);
			}

			if (!data) {
				throw new Error(`Secret not found or cannot be decrypted: ${secretId}`);
			}

			return data;
		},
	};
}
