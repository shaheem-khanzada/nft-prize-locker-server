export default  (videos: any) => {
    const video = videos.find((v: any) => v);
    if (video) {
        return Object.assign(video.snippet, video.statistics);
    }
    return {};
}