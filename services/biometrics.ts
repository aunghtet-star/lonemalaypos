// Basic WebAuthn helpers for registering and authenticating a credential
export async function registerBiometricCredential(): Promise<boolean> {
  if (!('credentials' in navigator)) throw new Error('WebAuthn not supported');

  const challenge = Uint8Array.from(String(Date.now()), c => c.charCodeAt(0));
  const userId = Uint8Array.from('lonemalay-pos-user', c => c.charCodeAt(0));

  const publicKey: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: { name: 'Lonemalay POS' },
    user: { id: userId, name: 'owner@familyrestaurant.com', displayName: 'Restaurant Owner' },
    pubKeyCredParams: [{ type: 'public-key', alg: -7 }], // ES256
    authenticatorSelection: { userVerification: 'preferred' },
    timeout: 60000
  };

  const credential = await navigator.credentials.create({ publicKey });
  if (!credential) return false;
  localStorage.setItem('pos_bio_registered', 'true');
  localStorage.setItem('pos_bio_id', (credential as any).id || '');
  return true;
}

export async function authenticateBiometric(): Promise<boolean> {
  if (!('credentials' in navigator)) throw new Error('WebAuthn not supported');
  const bioId = localStorage.getItem('pos_bio_id') || '';
  const challenge = Uint8Array.from(String(Date.now()), c => c.charCodeAt(0));

  const publicKey: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: bioId ? [{ id: Uint8Array.from(bioId, c => c.charCodeAt(0)), transports: ['internal'], type: 'public-key' }] : [],
    userVerification: 'preferred',
    timeout: 60000
  };

  const assertion = await navigator.credentials.get({ publicKey });
  if (!assertion) return false;
  return true;
}

export function removeBiometricCredential() {
  localStorage.removeItem('pos_bio_registered');
  localStorage.removeItem('pos_bio_id');
}
