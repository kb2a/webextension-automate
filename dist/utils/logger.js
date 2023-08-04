export function logPending(logger, metadata) {
    const log = logger.add({
        name: metadata.name,
        description: metadata.description,
        message: metadata.message.pending,
        status: 'pending',
        error: {
            message: '',
            stack: '',
        },
        duration: 0,
        timestamp: Date.now(),
    });
    return log;
}
export function logUpdate(logger, logData) {
    logger.data = {
        ...logger.data,
        ...logData,
    };
}
export function logError(logger, metadata, error) {
    logger.data = {
        ...logger.data,
        status: 'error',
        message: metadata.message.error ?? error.message,
        error: {
            message: error.message,
            stack: error.stack ?? '',
        },
        duration: Date.now() - logger.data.timestamp,
    };
}
export function logSuccess(logger, metadata) {
    logger.data = {
        ...logger.data,
        message: metadata.message.success,
        status: 'success',
        duration: Date.now() - logger.data.timestamp,
    };
}
//# sourceMappingURL=logger.js.map