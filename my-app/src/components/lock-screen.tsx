"use client";

import { Brand } from "@/components/brand";
import { LoginForm } from "@/components/login-form";

export function LockScreen() {
	return (
		<main className="auth-shell">
			<Brand />
			<LoginForm />
		</main>
	);
}
