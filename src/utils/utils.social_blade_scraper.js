const axios = require('axios');

const getPlatformData = async (platform, username) => {
  let url;
  switch (platform) {
    case 'facebook':
      url = `https://matrix.sbapis.com/b/facebook/statistics`;
      break;
    case 'instagram':
      url = `https://matrix.sbapis.com/b/instagram/statistics`;
      break;
    case 'twitter':
      url = `https://matrix.sbapis.com/b/twitter/statistics`;
      break;
    default:
      throw new Error('Unsupported platform');
  }

  try {
    const response = await axios.get(url, {
      headers: {
        'query': username,
        'history': 'extended',
        'clientid': process.env.CLIENT_ID,
        'token': process.env.TOKEN
      }
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
};

const convertToEpoch = (daysAgo) => {
  const now = new Date();
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() - daysAgo);
  return targetDate.getTime();
};

const mapGrowthDataToEpoch = (growthData) => {
  try {
    const epochData = [];
    for (const [daysAgo, value] of Object.entries(growthData)) {
      const epochKey = convertToEpoch(parseInt(daysAgo));
      epochData.push([epochKey, value]);
    }
    return epochData;
  } catch (error) {
    return false;
  }
};

const calculateGrowthPercentage = (dailyData, key) => {
  if (dailyData.length < 2) return null;

  const latest = parseInt(dailyData[0][key]);
  const earliest = parseInt(dailyData[dailyData.length - 1][key]);

  if (isNaN(latest) || isNaN(earliest) || earliest === 0) {
    return null;
  }

  return ((latest - earliest) / earliest) * 100;
};

const mapData = (platform, data) => {
  let mappedData = {
    social: platform,
    BasicInfo: {
      mediaUploads: null,
      followers: null,
      following: null,
      avgLikes: null,
      avgComments: null,
      reach: null 
    },
    ProfileGrowth: {
      followersDifference: null,
      followingDifference: null,
      followersGrowth: null,
      followingGrowth: null,
      tweetsGrowth: null
    },
    SocialBladeRanking: {
      TotalGrade: data.data.misc.grade.grade,
      MediaRank: data.data.ranks.likes ? data.data.ranks?.likes?.toString() : null,
      FollowingRank: data.data.ranks.talking_about ? data.data.ranks.talking_about?.toString() : null
    },
    days30: {
      FollowersChange: null,
      FollowingChange: null,
      MediaChange: null
    },
    data: [],
    extractedData: []
  };

  switch (platform) {
    case 'facebook':
      mappedData.BasicInfo.reach = data.data.ranks.talking_about?.toString();
      mappedData.BasicInfo.mediaUploads = data.data.statistics.total.talking_about?.toString();
      mappedData.BasicInfo.avgLikes = (data.data.statistics.total.likes / data.data.statistics.total.talking_about)?.toString();
      mappedData.BasicInfo.followers = data.data.statistics.total.likes?.toString();
      mappedData.days30.FollowersChange = data.data.statistics.growth?.likes['30']?.toString();
      mappedData.ProfileGrowth.followersDifference = data.data.statistics?.growth?.likes['30'];
      mappedData.ProfileGrowth.followersGrowth = calculateGrowthPercentage(data.data.daily, 'likes');
      mappedData.data = data.data.daily.map(day => ({
        date: day?.date,
        likes: day?.likes?.toString(),
        talking_about: day.talking_about?.toString(),
        following: null,
        tweets: null
      }));
      mappedData?.extractedData.push(
        {
          containerId: 'followers',
          seriesData: mapGrowthDataToEpoch(data.data.statistics.growth?.likes) ? mapGrowthDataToEpoch(data.data.statistics.growth.likes) : []
        },
        {
          containerId: 'talking_about',
          seriesData: mapGrowthDataToEpoch(data.data.statistics.growth?.talking_about) ? mapGrowthDataToEpoch(data.data.statistics.growth.talking_about) : []
        }
      );
      break;
    case 'instagram':
      mappedData.BasicInfo.reach = data.data.statistics.total.engagement_rate?.toString();
      mappedData.BasicInfo.mediaUploads = data.data.statistics.total.media?.toString();
      mappedData.BasicInfo.followers = data.data?.statistics?.total?.followers?.toString();
      mappedData.BasicInfo.following = data.data.statistics?.total?.following?.toString();
      mappedData.BasicInfo.avgLikes = data.data.statistics.average.likes?.toString();
      mappedData.BasicInfo.avgComments = data.data.statistics.average.comments?.toString();
      mappedData.days30.FollowersChange = data.data.statistics.growth?.followers['30']?.toString();
      mappedData.ProfileGrowth.followersDifference = data.data.statistics?.growth?.followers['30'];
      mappedData.ProfileGrowth.followersGrowth = calculateGrowthPercentage(data.data.daily, 'followers');
      mappedData.ProfileGrowth.followingGrowth = calculateGrowthPercentage(data.data.daily, 'following');
      mappedData.data = data.data.daily.map(day => ({
        date: day.date,
        followers: day.followers?.toString(),
        following: day.following?.toString(),
        media: day.media.toString(),
        tweets: null
      }));
      mappedData.extractedData.push(
        {
          containerId: 'followers',
          seriesData: mapGrowthDataToEpoch(data.data.statistics.growth?.followers)
        },
        {
          containerId: 'media',
          seriesData: mapGrowthDataToEpoch(data.data.statistics.growth?.media)
        }
      );
      break;
    case 'twitter':
      mappedData.BasicInfo.reach = data.data.statistics.growth.tweets['30']?.toString();
      mappedData.BasicInfo.followers = data.data.statistics.total.followers?.toString();
      mappedData.BasicInfo.following = data.data.statistics.total.following?.toString();
      mappedData.BasicInfo.mediaUploads = data.data.statistics.total.tweets?.toString();
      mappedData.days30.FollowersChange = data.data.statistics.growth.followers['30']?.toString();
      mappedData.ProfileGrowth.followersDifference = data.data.statistics.growth?.followers['30'];
      mappedData.ProfileGrowth.tweetsGrowth = data.data.statistics.growth?.tweets['30'];
      mappedData.ProfileGrowth.followersGrowth = calculateGrowthPercentage(data.data.daily, 'followers');
      mappedData.ProfileGrowth.followingGrowth = calculateGrowthPercentage(data.data.daily, 'following');
      mappedData.data = data.data.daily.map(day => ({
        date: day.date,
        followers: day.followers.toString(),
        following: day.following.toString(),
        tweets: day.tweets.toString()
      }));
      mappedData.extractedData.push(
        {
          containerId: 'followers',
          seriesData: mapGrowthDataToEpoch(data.data.statistics.growth?.followers)
        },
        {
          containerId: 'tweets',
          seriesData: mapGrowthDataToEpoch(data.data.statistics.growth?.tweets)
        }
      );
      break;
  }

  return mappedData;
};



module.exports = { getPlatformData, mapData };
