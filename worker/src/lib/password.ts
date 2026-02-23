/**
 * Password Hashing and Verification
 * Web Crypto API の PBKDF2 を使用したパスワードハッシュ
 */

const ITERATIONS = 100000;
const SALT_LENGTH = 16;
const HASH_LENGTH = 64;
const ALGORITHM = 'SHA-256';

/**
 * ランダムなソルトを生成
 */
function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

/**
 * ArrayBuffer を Base64 文字列に変換
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 文字列を Uint8Array に変換
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * PBKDF2 でパスワードをハッシュ化
 * 
 * @param password - ハッシュ化するパスワード
 * @returns ハッシュ文字列（フォーマット: iterations:base64(salt):base64(hash)）
 */
export async function hashPassword(password: string): Promise<string> {
  // ソルト生成
  const salt = generateSalt();
  
  // PBKDF2 キーのインポート
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // PBKDF2 でビット導出
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: ITERATIONS,
      hash: ALGORITHM,
    },
    passwordKey,
    HASH_LENGTH * 8  // bits
  );
  
  // フォーマット: iterations:base64(salt):base64(hash)
  const saltBase64 = arrayBufferToBase64(salt.buffer as ArrayBuffer);
  const hashBase64 = arrayBufferToBase64(hashBuffer);
  
  return `${ITERATIONS}:${saltBase64}:${hashBase64}`;
}

/**
 * パスワードを検証
 * 
 * @param password - 検証するパスワード
 * @param storedHash - 保存されているハッシュ
 * @returns パスワードが一致するかどうか
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  try {
    const parts = storedHash.split(':');
    if (parts.length !== 3) {
      console.error('Invalid hash format');
      return false;
    }
    
    const [iterationsStr, saltBase64, hashBase64] = parts;
    const iterations = parseInt(iterationsStr, 10);
    
    if (isNaN(iterations) || iterations <= 0) {
      console.error('Invalid iterations in hash');
      return false;
    }
    
    // ソルトとハッシュをデコード
    const salt = base64ToUint8Array(saltBase64);
    const storedHashBytes = base64ToUint8Array(hashBase64);
    
    // PBKDF2 キーのインポート
    const passwordKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    // 同じパラメータでハッシュを導出
    const derivedHashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: iterations,
        hash: ALGORITHM,
      },
      passwordKey,
      storedHashBytes.length * 8  // bits
    );
    
    const derivedHashBytes = new Uint8Array(derivedHashBuffer);
    
    // タイミングセーフな比較
    if (derivedHashBytes.length !== storedHashBytes.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < derivedHashBytes.length; i++) {
      result |= derivedHashBytes[i] ^ storedHashBytes[i];
    }
    
    return result === 0;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * パスワードの強度をチェック
 * 
 * @param password - チェックするパスワード
 * @returns エラーメッセージ（問題ない場合はnull）
 */
export function validatePassword(password: string): string | null {
  if (!password || password.length < 8) {
    return 'パスワードは8文字以上必要です';
  }
  
  if (password.length > 128) {
    return 'パスワードは128文字以内にしてください';
  }
  
  // 文字の多様性チェック（オプション）
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const typesCount = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
  
  if (typesCount < 2) {
    return 'パスワードは英字（大文字・小文字）、数字、記号のうち2種類以上を含んでください';
  }
  
  return null;
}