import { supabase } from "../supabase";

describe("supabase.ts", () => {
  it("should export supabase client", () => {
    expect(supabase).toBeDefined();
  });

  it("should have auth property", () => {
    expect(supabase.auth).toBeDefined();
  });

  it("should have from method", () => {
    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe("function");
  });

  it("should have storage property", () => {
    expect(supabase.storage).toBeDefined();
  });
});

