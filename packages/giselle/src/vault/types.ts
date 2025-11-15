interface EncryptOptions {
	name?: string;
	description?: string;
}
/**
 * Interface for vault operations
 */
export interface Vault {
	/**
	 * Encrypts a plaintext string
	 * @param plaintext - The plaintext to encrypt
	 * @param options - Optional encryption options
	 * @returns The encrypted ciphertext
	 */
	encrypt(plaintext: string, options?: EncryptOptions): Promise<string>;

	/**
	 * Decrypts a ciphertext string
	 * @param ciphertext - The ciphertext to decrypt
	 * @returns The decrypted plaintext
	 */
	decrypt(ciphertext: string): Promise<string>;
}

/**
 * Interface for vault drivers
 */
export interface VaultDriver {
	/**
	 * Encrypts a plaintext string
	 * @param plaintext - The plaintext to encrypt
	 * @returns The encrypted ciphertext
	 */
	encrypt(plaintext: string, options?: EncryptOptions): Promise<string>;

	/**
	 * Decrypts a ciphertext string
	 * @param ciphertext - The ciphertext to decrypt
	 * @returns The decrypted plaintext
	 */
	decrypt(ciphertext: string): Promise<string>;
}
