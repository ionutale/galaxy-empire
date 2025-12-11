<script lang="ts">
	interface Props {
		primary?: boolean;
		size?: 'sm' | 'md' | 'lg';
		label: string;
		onclick?: () => void;
	}
	const { primary = false, size = 'md', label, ...props }: Props = $props();
	const classes = `btn ${primary ? 'btn-primary' : 'btn-ghost'} ${size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : ''}`;
</script>

<button type="button" class={classes} {...props}>{label}</button>
