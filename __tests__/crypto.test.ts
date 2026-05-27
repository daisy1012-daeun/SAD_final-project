import { describe, it, expect, beforeAll } from "vitest";

beforeAll(() => {
  process.env.ENCRYPTION_KEY = Buffer.from("01234567890123456789012345678901").toString("base64");
  process.env.SEARCH_HASH_SECRET = "test-hmac-secret-32-bytes-xxxxxyz";
});

describe("lib/crypto", () => {
  it("encrypt → decrypt 왕복 정확성", async () => {
    const { encrypt, decrypt } = await import("@/lib/crypto");
    const plain = "2024123456";
    expect(decrypt(encrypt(plain))).toBe(plain);
  });

  it("동일 입력이 다른 IV로 다른 암호문 생성", async () => {
    const { encrypt } = await import("@/lib/crypto");
    const plain = "2024123456";
    expect(encrypt(plain)).not.toBe(encrypt(plain));
  });

  it("hashForSearch는 동일 입력에 동일 해시 반환", async () => {
    const { hashForSearch } = await import("@/lib/crypto");
    expect(hashForSearch("test@email.com")).toBe(hashForSearch("test@email.com"));
  });

  it("hashForSearch는 다른 입력에 다른 해시 반환", async () => {
    const { hashForSearch } = await import("@/lib/crypto");
    expect(hashForSearch("a@b.com")).not.toBe(hashForSearch("c@d.com"));
  });
});
