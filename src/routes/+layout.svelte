<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Sidebar from '$lib/components/Sidebar.svelte';
	import '../app.css';
	import { authStore, isLoggedIn } from '$lib/stores/auth';
	import { fromStore } from 'svelte/store';

	let { children } = $props();

	let loggedIn = fromStore(isLoggedIn);

	// Login / register form state
	let mode = $state<'login' | 'register'>('login');
	let email = $state('');
	let name = $state('');
	let password = $state('');
	let authError = $state('');
	let submitting = $state(false);

	async function handleAuth(e: Event) {
		e.preventDefault();
		authError = '';
		submitting = true;
		try {
			if (mode === 'login') {
				await authStore.login(email, password);
			} else {
				await authStore.register(name, email, password);
			}
		} catch (err: unknown) {
			authError = err instanceof Error ? err.message : 'Authentication failed';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if loggedIn.current}
	<div class="app-layout">
		<Sidebar title="Food Dashboard" />
		<div class="content-area">
			{@render children()}
		</div>
	</div>
{:else}
	<div class="auth-screen">
		<div class="auth-card">
			<div class="auth-logo">🍔</div>
			<h1 class="auth-title">FreshMeal</h1>
			<p class="auth-sub">Dashboard — sign in to continue</p>

			<div class="auth-tabs">
				<button class="tab" class:active={mode === 'login'} onclick={() => mode = 'login'}>Sign In</button>
				<button class="tab" class:active={mode === 'register'} onclick={() => mode = 'register'}>Register</button>
			</div>

			<form onsubmit={handleAuth} class="auth-form">
				{#if mode === 'register'}
					<div class="field">
						<label for="auth-name">Full Name</label>
						<input id="auth-name" type="text" placeholder="Jane Doe" bind:value={name} required />
					</div>
				{/if}
				<div class="field">
					<label for="auth-email">Email</label>
					<input id="auth-email" type="email" placeholder="you@example.com" bind:value={email} required />
				</div>
				<div class="field">
					<label for="auth-password">Password</label>
					<input id="auth-password" type="password" placeholder="••••••••" bind:value={password} required />
				</div>

				{#if authError}
					<p class="auth-error">{authError}</p>
				{/if}

				<button type="submit" class="btn-auth" disabled={submitting}>
					{submitting ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
				</button>
			</form>
		</div>
	</div>
{/if}

<style>
	.app-layout {
		display: flex;
		min-height: 100vh;
	}
	.content-area {
		flex: 1;
		margin-left: 260px;
		min-width: 0;
	}

	/* ── Auth screen ── */
	.auth-screen {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #0b74de 0%, #0f172a 100%);
	}
	.auth-card {
		background: #fff;
		border-radius: 16px;
		padding: 2.5rem 2rem;
		width: 100%;
		max-width: 380px;
		box-shadow: 0 25px 50px rgba(0,0,0,0.25);
		text-align: center;
	}
	.auth-logo { font-size: 2.5rem; margin-bottom: 0.5rem; }
	.auth-title { margin: 0; font-size: 1.6rem; color: #0f172a; }
	.auth-sub { color: #64748b; font-size: 0.9rem; margin: 0.25rem 0 1.5rem; }

	.auth-tabs {
		display: flex;
		border-radius: 8px;
		overflow: hidden;
		border: 1px solid #e2e8f0;
		margin-bottom: 1.5rem;
	}
	.tab {
		flex: 1;
		padding: 0.6rem;
		background: #f8fafc;
		border: none;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 500;
		color: #475569;
		transition: all 0.15s;
	}
	.tab.active {
		background: #0b74de;
		color: #fff;
	}

	.auth-form { text-align: left; }
	.field { margin-bottom: 1rem; }
	.field label { display: block; font-size: 0.85rem; font-weight: 500; color: #334155; margin-bottom: 0.3rem; }
	.field input {
		width: 100%;
		padding: 0.6rem 0.75rem;
		border: 1px solid #cbd5e1;
		border-radius: 8px;
		font-size: 0.9rem;
		outline: none;
		box-sizing: border-box;
		transition: border-color 0.15s;
	}
	.field input:focus { border-color: #0b74de; }

	.auth-error {
		background: #fee2e2;
		color: #b91c1c;
		padding: 0.5rem 0.75rem;
		border-radius: 6px;
		font-size: 0.85rem;
		margin-bottom: 1rem;
	}

	.btn-auth {
		width: 100%;
		padding: 0.75rem;
		background: #0b74de;
		color: #fff;
		border: none;
		border-radius: 8px;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.15s;
	}
	.btn-auth:hover:not(:disabled) { background: #095fb8; }
	.btn-auth:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
