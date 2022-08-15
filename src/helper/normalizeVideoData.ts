export default (videos: any, savedVideo: any) => {
  if (Array.isArray(videos)) {
    const video = videos.find((v: any) => v);
    if (video && video?.snippet && video?.statistics) {
      const updatedVideo = Object.assign(video.snippet, video.statistics);
      if (savedVideo) {
        return Object.assign(updatedVideo, JSON.parse(JSON.stringify(savedVideo)))
      }
      return updatedVideo;
    }
    return video || {};
  }
  return videos;
};
