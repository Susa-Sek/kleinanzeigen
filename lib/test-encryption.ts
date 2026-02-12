/**
 * Encryption Test Utility
 *
 * Run this script to verify encryption is working correctly:
 *
 * npx tsx lib/test-encryption.ts
 *
 * OR with ts-node:
 * npx ts-node lib/test-encryption.ts
 */

import { encrypt, decrypt, verifyEncryption } from './encryption';

async function testEncryption() {
  console.log('🔐 Testing AES-256 Encryption...\n');

  // Test data
  const testPassword = 'mySecurePassword123!';
  const testEmail = 'test@kleinanzeigen.de';

  try {
    // Test 1: Encrypt and decrypt a password
    console.log('Test 1: Encrypt and Decrypt Password');
    console.log('-----------------------------------');
    console.log(`Original password: ${testPassword}`);

    const encrypted = encrypt(testPassword);
    console.log(`Encrypted: ${encrypted.substring(0, 50)}...`);

    const decrypted = decrypt(encrypted);
    console.log(`Decrypted: ${decrypted}`);

    if (testPassword === decrypted) {
      console.log('✅ Test 1 PASSED: Password encryption/decryption works!\n');
    } else {
      console.log('❌ Test 1 FAILED: Decrypted password does not match original!\n');
      return;
    }

    // Test 2: Verify encryption
    console.log('Test 2: Verify Encryption');
    console.log('-----------------------------------');
    const isValid = verifyEncryption(encrypted);
    console.log(`Verification result: ${isValid}`);

    if (isValid) {
      console.log('✅ Test 2 PASSED: Encryption verification works!\n');
    } else {
      console.log('❌ Test 2 FAILED: Verification failed!\n');
      return;
    }

    // Test 3: Multiple encryptions produce different ciphertexts
    console.log('Test 3: Randomized Encryption (IV)');
    console.log('-----------------------------------');
    const encrypted1 = encrypt(testPassword);
    const encrypted2 = encrypt(testPassword);

    console.log(`Encryption 1: ${encrypted1.substring(0, 50)}...`);
    console.log(`Encryption 2: ${encrypted2.substring(0, 50)}...`);

    if (encrypted1 !== encrypted2) {
      console.log('✅ Test 3 PASSED: Different IVs produce different ciphertexts!\n');
    } else {
      console.log('❌ Test 3 FAILED: Ciphertexts are identical (weak encryption)!\n');
      return;
    }

    // Test 4: Both decrypt to the same value
    console.log('Test 4: Decrypt Both Ciphertexts');
    console.log('-----------------------------------');
    const decrypted1 = decrypt(encrypted1);
    const decrypted2 = decrypt(encrypted2);

    console.log(`Decrypted 1: ${decrypted1}`);
    console.log(`Decrypted 2: ${decrypted2}`);

    if (decrypted1 === testPassword && decrypted2 === testPassword) {
      console.log('✅ Test 4 PASSED: Both decrypt to original password!\n');
    } else {
      console.log('❌ Test 4 FAILED: Decryption mismatch!\n');
      return;
    }

    // Test 5: Encrypt email
    console.log('Test 5: Encrypt Email');
    console.log('-----------------------------------');
    const encryptedEmail = encrypt(testEmail);
    const decryptedEmail = decrypt(encryptedEmail);

    console.log(`Original email: ${testEmail}`);
    console.log(`Encrypted: ${encryptedEmail.substring(0, 50)}...`);
    console.log(`Decrypted: ${decryptedEmail}`);

    if (testEmail === decryptedEmail) {
      console.log('✅ Test 5 PASSED: Email encryption works!\n');
    } else {
      console.log('❌ Test 5 FAILED: Email decryption failed!\n');
      return;
    }

    // Test 6: Invalid ciphertext handling
    console.log('Test 6: Invalid Ciphertext Handling');
    console.log('-----------------------------------');
    try {
      decrypt('invalid_ciphertext_12345');
      console.log('❌ Test 6 FAILED: Should have thrown an error!\n');
    } catch (error) {
      console.log('✅ Test 6 PASSED: Invalid ciphertext properly rejected!\n');
    }

    // Final Summary
    console.log('═══════════════════════════════════');
    console.log('🎉 ALL TESTS PASSED!');
    console.log('═══════════════════════════════════');
    console.log('Encryption is working correctly.');
    console.log('You can safely store encrypted passwords in the database.');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\nStack trace:', error.stack);

    if (error.message.includes('ENCRYPTION_KEY')) {
      console.error('\n⚠️  Make sure ENCRYPTION_KEY is set in your .env.local file!');
      console.error('Generate one with: openssl rand -base64 32');
    }
  }
}

// Run tests
testEncryption();
