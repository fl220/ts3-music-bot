export declare class MusicBot {
    private ts3;
    private readonly queue;
    private readonly player;
    constructor();
    private sendMessage;
    playNextInQueue(): Promise<void>;
    start(): Promise<void>;
}
