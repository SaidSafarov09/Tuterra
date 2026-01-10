import { toast } from 'sonner';

interface UndoOptions {
    message: string;
    undoMessage?: string;
    duration?: number;
    onSuccess?: () => Promise<void> | void;
    onCancel?: () => void;
}

export async function deleteWithUndo<T>(
    action: () => Promise<T>,
    options: UndoOptions
): Promise<T | null> {
    const {
        message,
        undoMessage = 'Действие отменено',
        duration = 5000,
        onSuccess,
        onCancel
    } = options;

    let isCancelled = false;
    let countdown = Math.floor(duration / 1000);

    return new Promise<T | null>((resolve) => {
        const toastId = toast.warning(`${message} ${countdown}`, {
            duration: duration,
            action: {
                label: 'Отмена',
                onClick: () => {
                    isCancelled = true;
                    toast.dismiss(toastId);
                    toast.info(undoMessage);
                    if (onCancel) onCancel();
                    resolve(null);
                },
            },
        });

        // Update countdown every second
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0 && !isCancelled) {
                toast.warning(`${message} ${countdown}`, {
                    id: toastId,
                    duration: duration,
                    action: {
                        label: 'Отмена',
                        onClick: () => {
                            isCancelled = true;
                            clearInterval(countdownInterval);
                            toast.dismiss(toastId);
                            toast.info(undoMessage);
                            if (onCancel) onCancel();
                            resolve(null);
                        },
                    },
                });
            } else {
                clearInterval(countdownInterval);
            }
        }, 1000);

        setTimeout(async () => {
            clearInterval(countdownInterval);
            if (!isCancelled) {
                toast.dismiss(toastId);
                try {
                    const result = await action();
                    if (onSuccess) {
                        await onSuccess();
                    }
                    resolve(result);
                } catch (e) {
                    resolve(null);
                }
            }
        }, duration);
    });
}
