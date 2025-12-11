<script lang="ts">
	import { onMount, onDestroy, afterUpdate } from 'svelte';
	import { fade, fly } from 'svelte/transition';

	export let channel = 'global';

	let messages: any[] = [];
	let newMessage = '';
	let chatContainer: HTMLElement;
	let interval: any;
	let isOpen = false;
	let fileInput: HTMLInputElement;
	let uploading = false;

	let activeTab: 'global' | 'alliance' | 'messages' = 'global';
	let conversations: any[] = [];
	let activeConversation: string | null = null; // userId of partner

	async function fetchMessages() {
		if (activeTab === 'messages') {
			await fetchConversations();
			if (activeConversation) {
				await fetchDM(activeConversation);
			}
			return;
		}

		try {
			const lastTimestamp = messages.length > 0 ? messages[messages.length - 1].timestamp : null;
			const url = `/api/chat?channel=${channel}${lastTimestamp ? `&after=${lastTimestamp}` : ''}`;
			const res = await fetch(url);
			if (res.ok) {
				const newMsgs = await res.json();
				if (newMsgs.length > 0) {
					if (messages.length === 0) {
						messages = newMsgs;
					} else {
						const existingIds = new Set(messages.map(m => m.id));
						const uniqueNew = newMsgs.filter((m: any) => !existingIds.has(m.id));
						messages = [...messages, ...uniqueNew];
					}
					setTimeout(scrollToBottom, 100);
				}
			}
		} catch (e) {
			console.error('Chat poll error', e);
		}
	}

	async function fetchConversations() {
		try {
			const res = await fetch('/api/messages');
			if (res.ok) {
				const raw = await res.json();
				// Group by partner
				// This is a simplified grouping for demo
				const grouped = new Map();
				// We need current user ID to know who is partner, but we don't have it easily here without props/store
				// For now, we assume senderId is partner if not us, or receiverId if sender is us.
				// Actually, the API returns senderName.
				// Let's just list raw messages for now or try to deduce.
				// Ideally we pass `user` prop to ChatBox.
				conversations = raw; // Placeholder
			}
		} catch (e) {}
	}

	async function fetchDM(partnerId: string) {
		try {
			const res = await fetch(`/api/messages?partnerId=${partnerId}`);
			if (res.ok) {
				messages = await res.json();
				setTimeout(scrollToBottom, 100);
			}
		} catch (e) {}
	}

	async function sendMessage() {
		if (!newMessage.trim()) return;
		const content = newMessage;
		newMessage = ''; 

		try {
			if (activeTab === 'messages' && activeConversation) {
				await fetch('/api/messages', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ content, receiverId: activeConversation })
				});
				await fetchDM(activeConversation);
			} else {
				await fetch('/api/chat', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ content, channel, type: 'text' })
				});
				await fetchMessages();
			}
		} catch (e) {
			console.error('Send error', e);
		}
	}


	async function handleFileUpload(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files[0]) {
			uploading = true;
			const formData = new FormData();
			formData.append('file', target.files[0]);

			try {
				const res = await fetch('/api/upload', {
					method: 'POST',
					body: formData
				});
				if (res.ok) {
					const { url } = await res.json();
					// Send message with image type
					await fetch('/api/chat', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ content: url, channel, type: 'image' })
					});
					await fetchMessages();
				}
			} catch (e) {
				console.error('Upload error', e);
			} finally {
				uploading = false;
				if (fileInput) fileInput.value = '';
			}
		}
	}

	function scrollToBottom() {
		if (chatContainer) {
			chatContainer.scrollTop = chatContainer.scrollHeight;
		}
	}

	onMount(() => {
		fetchMessages();
		interval = setInterval(fetchMessages, 3000);
	});

	onDestroy(() => {
		clearInterval(interval);
	});

	function formatTime(ts: string) {
		return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	}
</script>

<div class="fixed bottom-4 left-4 z-50 flex flex-col items-start">
	{#if isOpen}
		<div class="w-80 h-96 glass-panel flex flex-col rounded-xl shadow-2xl border border-white/10 mb-2 overflow-hidden" transition:fly={{ y: 20, duration: 200 }}>
			<!-- Header -->
			<div class="p-3 border-b border-white/10 bg-black/20 flex flex-col gap-2">
				<div class="flex justify-between items-center">
					<h3 class="font-bold text-neon-blue">Comms</h3>
					<button class="btn btn-xs btn-ghost" on:click={() => isOpen = false}>✕</button>
				</div>
				<div class="tabs tabs-boxed tabs-xs bg-transparent p-0">
					<button class="tab {activeTab === 'global' ? 'tab-active' : ''}" on:click={() => { activeTab = 'global'; messages = []; fetchMessages(); }}>Global</button>
					<button class="tab {activeTab === 'alliance' ? 'tab-active' : ''}" on:click={() => activeTab = 'alliance'}>Alliance</button>
					<button class="tab {activeTab === 'messages' ? 'tab-active' : ''}" on:click={() => { activeTab = 'messages'; messages = []; fetchMessages(); }}>DMs</button>
				</div>
			</div>

			<!-- Messages -->
			<div class="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin scrollbar-thumb-white/10" bind:this={chatContainer}>
				{#if activeTab === 'messages' && !activeConversation}
					<div class="text-sm text-slate-400">
						<p class="mb-2">Recent Messages:</p>
						{#each conversations as conv}
							<button class="btn btn-ghost btn-xs w-full justify-start truncate" on:click={() => { activeConversation = conv.senderId; fetchDM(conv.senderId); }}>
								{conv.senderName || conv.senderId}
							</button>
						{/each}
						<div class="divider my-2"></div>
						<p class="text-xs opacity-50">To start a new DM, visit a player profile (not implemented yet).</p>
					</div>
				{:else}
					{#each messages as msg}
						<div class="flex flex-col gap-1">
							<div class="flex items-baseline gap-2">
								<span class="font-bold text-xs text-slate-300">{msg.username || msg.senderId}</span>
								<span class="text-[10px] text-slate-500">{formatTime(msg.timestamp)}</span>
							</div>
							{#if msg.type === 'image'}
								<img src={msg.content} alt="User upload" class="rounded-lg max-w-full border border-white/10" />
							{:else}
								<p class="text-sm text-slate-200 break-words bg-white/5 p-2 rounded-lg rounded-tl-none">{msg.content}</p>
							{/if}
						</div>
					{/each}
				{/if}
			</div>

			<!-- Input -->
			<div class="p-2 border-t border-white/10 bg-black/20 flex gap-2">
				<button class="btn btn-square btn-sm btn-ghost text-slate-400" on:click={() => fileInput.click()} disabled={uploading}>
					{#if uploading}
						<span class="loading loading-spinner loading-xs"></span>
					{:else}
						📷
					{/if}
				</button>
				<input type="file" class="hidden" accept="image/*" bind:this={fileInput} on:change={handleFileUpload} />
				
				<input
					type="text"
					class="input input-sm input-bordered flex-1 bg-black/20 text-white"
					placeholder="Message..."
					bind:value={newMessage}
					on:keydown={(e) => e.key === 'Enter' && sendMessage()}
				/>
				<button class="btn btn-square btn-sm btn-primary" on:click={sendMessage}>➤</button>
			</div>
		</div>
	{/if}

	<button class="btn btn-circle btn-primary shadow-lg border-2 border-white/20" on:click={() => isOpen = !isOpen}>
		💬
	</button>
</div>
