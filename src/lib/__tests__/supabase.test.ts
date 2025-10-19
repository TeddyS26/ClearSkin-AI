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

  it("should have auth methods", () => {
    expect(supabase.auth.getSession).toBeDefined();
    expect(supabase.auth.getUser).toBeDefined();
    expect(supabase.auth.signUp).toBeDefined();
    expect(supabase.auth.signInWithPassword).toBeDefined();
    expect(supabase.auth.signOut).toBeDefined();
  });

  it("should have database methods", () => {
    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe("function");
  });

  it("should have storage methods", () => {
    expect(supabase.storage).toBeDefined();
    expect(supabase.storage.from).toBeDefined();
  });
});