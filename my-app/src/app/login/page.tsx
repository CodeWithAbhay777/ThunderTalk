import { LoginForm } from "@/components/login-form";
import { Brand } from "@/components/brand";

export default function LoginPage() {
	return (
		<main className="auth-shell">
			<Brand />
			<LoginForm />
		</main>
	);
}
