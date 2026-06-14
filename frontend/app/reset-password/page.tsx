"use client";
// Destination for the Supabase password-reset email link. Supabase establishes a
// short-lived recovery session when the user arrives here; we then collect a new
// password and persist it via supabase.auth.updateUser.
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast";

export default function ResetPasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "done">("idle");

  // The recovery session is created automatically from the link; confirm it exists.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitState !== "idle") return;
    if (password.length < 6) {
      toast("Password must be at least 6 characters.", "down");
      return;
    }
    if (password !== confirm) {
      toast("Passwords don't match.", "down");
      return;
    }

    setSubmitState("loading");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setSubmitState("idle");
      toast(error.message, "down");
      return;
    }
    setSubmitState("done");
    toast("Password updated — taking you to your dashboard.", "up");
    setTimeout(() => router.push("/dashboard"), 800);
  }

  return (
    <div className="cof-auth">
      <section className="auth-form" style={{ margin: "0 auto" }}>
        <div className="auth-card">
          <div className="mini-brand">
            <span className="sq">₹</span><b>Coffer</b>
          </div>

          <div className="head">
            <h2>Set a new password</h2>
            <p>
              {ready
                ? "Choose a new password for your account."
                : "Open the reset link from your email to continue."}
            </p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" noValidate>
            <div className="field">
              <label htmlFor="pw">New password</label>
              <div className="input">
                <input
                  type="password"
                  id="pw"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={!ready}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="pw2">Confirm password</label>
              <div className="input">
                <input
                  type="password"
                  id="pw2"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={!ready}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!ready}
              className={["submit", submitState !== "idle" && submitState].filter(Boolean).join(" ")}
            >
              <span className="lab">Update password <span className="arr">→</span></span>
              <span className="spin" />
              <svg className="chk" viewBox="0 0 28 28"><path d="M6 14.5 L12 20 L22 8" /></svg>
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
