const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const headers = {
    'Host': 'socialblade.com',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Cookie': 'PHPSESSXX=gg44b14r7j2tkl8906rj1jdn28;'
};

function parseSocialbladeData(html, platform) {
    const $ = cheerio.load(html);
    const socialbladeData = {};

    const totalGrade = $('div[style^="float: left; width: 122px; height: 120px; padding: 10px;"] div:nth-child(1)').text().trim();
    socialbladeData['Total Grade'] = totalGrade;

    const ranks = $('div[style^="float: right; width: 720px; padding: 10px;"] div[style^="width: 174px; height: 110px; float: left; border-right: 1px solid #eee; margin: 5px;"]');
    ranks.each((index, element) => {
        const rankType = $(element).find('span').text().trim();
        const rankNumber = $(element).find('p').text().trim();
        socialbladeData[rankType] = rankNumber;
    });

    const mediaRankElement = $('div[style^="width: 220px; height: 110px; float: left; margin: 5px;"] p').eq(0);
    const mediaRank = mediaRankElement.length > 0 ? mediaRankElement.text().trim() : 'N/A';
    socialbladeData['Media Rank'] = mediaRank;

    const followingRankElement = $('div[style^="width: 220px; height: 110px; float: left; border-right: 1px solid #eee; margin: 5px;"]').eq(0);
    const followingRank = followingRankElement.length > 0 ? followingRankElement.find('p').text().trim() : 'N/A';
    socialbladeData['Following Rank'] = followingRank;

    return socialbladeData;
}

function parseLast30DaysData(html) {
    const $ = cheerio.load(html);
    const last30DaysData = {};

    const followersChange = $('div[style^="width: 280px; height: 80px; float: left; background: #fff; padding: 10px; margin-right: 10px; border-bottom: 2px solid #e2e2e2; text-align: center;"] p').eq(0).text().trim();
    last30DaysData['Followers Change'] = followersChange;

    const followingChange = $('div[style^="width: 270px; height: 80px; float: left; background: #fff; padding: 10px; margin-right: 10px; border-bottom: 2px solid #e2e2e2; text-align: center;"] p').eq(0).text().trim();
    last30DaysData['Following Change'] = followingChange;

    const mediaChange = $('div[style^="width: 270px; height: 80px; float: left; background: #fff; padding: 10px; border-bottom: 2px solid #e2e2e2; text-align: center;"] p').eq(0).text().trim();
    last30DaysData['Media Change'] = mediaChange;

    return last30DaysData;
}

async function getLinksFromAlt(html) {
    const $ = cheerio.load(html);
    const links = [];

    $('div[style="width: 1260px; margin: 20px auto;"] > div > a').each((index, element) => {
        const link = $(element).attr('href');
        links.push(link);
    });

    return links;
}

async function getSpanDataFromYouTubeUserTopInfo(html) {
    const $ = cheerio.load(html);
    const spanData = {};

    $('div#YouTubeUserTopInfoBlock > div.YouTubeUserTopInfo').each((index, element) => {
        const $element = $(element);
        const spanText1 = $element.find('span:nth-of-type(1)').text().trim();
        const spanText2 = $element.find('span:nth-of-type(2)').text().trim();
        if (spanText2.length > 0 && spanText1.length > 0) {
            spanData[spanText1] = spanText2;
        }
    });
    return spanData;
}

async function cleanData(html) {
    const $ = cheerio.load(html);
    const dataArray = [];

    $('div[style^="width: 860px;"]').each((index, element) => {
        const $element = $(element);
        const date = $element.find('div:nth-child(1) > div:nth-child(1)').text().trim();
        let followers = $element.find('div:nth-child(2) > div:nth-child(2)').contents().filter((index, el) => el.nodeType === 3).text().trim().replace(/[^0-9,+-]/g, '');
        let following = $element.find('div:nth-child(3) > div:nth-child(2)').contents().filter((index, el) => el.nodeType === 3).text().trim().replace(/[^0-9,+-]/g, '');
        let tweets = $element.find('div:nth-child(4) > div:nth-child(2)').contents().filter((index, el) => el.nodeType === 3).text().trim().replace(/[^0-9,+-]/g, '');

        followers = followers.split(' ')[0];

        if (date && followers && following && tweets) {
            const formattedDate = date.split('\n')[0].trim();
            dataArray.push({ date: formattedDate, followers, following, tweets });
        }
    });

    return dataArray;
}

async function filterLast30DaysData(data) {
    const currentDate = new Date();
    const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    return data.filter(entry => new Date(entry.date) >= thirtyDaysAgo);
}

async function calculatePercentageGrowth(data) {
    const initialData = data[0];
    const lastData = data[data.length - 1];

    const initialFollowers = parseInt(initialData.followers.replace(',', ''));
    const lastFollowers = parseInt(lastData.followers.replace(',', ''));

    const initialFollowing = parseInt(initialData.following);
    const lastFollowing = parseInt(lastData.following);

    const initialTweets = parseInt(initialData.tweets);
    const lastTweets = parseInt(lastData.tweets);

    const followersDifference = lastFollowers - initialFollowers;
    const followingDifference = lastFollowing - initialFollowing;

    const followersGrowth = ((lastFollowers - initialFollowers) / initialFollowers) * 100;
    const followingGrowth = ((lastFollowing - initialFollowing) / initialFollowing) * 100;
    const tweetsGrowth = ((lastTweets - initialTweets) / initialTweets) * 100;

    return {
        followersDifference,
        followingDifference,
        followersGrowth,
        followingGrowth,
        tweetsGrowth
    };
}

async function getLinksFromAlt(html) {
    const $ = cheerio.load(html);
    const links = [];

    $('div[style="width: 1260px; margin: 20px auto;"] > div > a').each((index, element) => {
        const link = $(element).attr('href');
        links.push(link);
    });

    return links;
}

function parseHighchartsScript(scriptContent) {
    const chartConfigs = [];
    const regex = /Highcharts\.chart\('([^']+)',\s*({[\s\S]*?})\);/g;
    let match;

    while ((match = regex.exec(scriptContent)) !== null) {
        const containerId = match[1];
        const configStr = match[2];

        try {
            // Safely parse the config object using Function constructor
            const config = new Function(`return ${configStr}`)();
            chartConfigs.push({ containerId, config });
        } catch (error) {
            console.error('Error parsing Highcharts configuration:', error);
        }
    }

    return chartConfigs;
}

function extractChartsFromHtml(html) {
    const $ = cheerio.load(html);
    const scripts = $('script[type="text/javascript"]').get();
    const chartConfigs = [];

    scripts.forEach(script => {
        const scriptContent = $(script).html();
        if (scriptContent.includes('Highcharts.chart')) {
            const configs = parseHighchartsScript(scriptContent);
            chartConfigs.push(...configs);
        }
    });

    return chartConfigs;
}


async function Get_All_Social_Media(account_name = "teampolstrat") {
    const url = `https://socialblade.com/search/search?query=${account_name}`;
    try {
        const response = await axios.get(url, { headers });
        const html = response.data;
        fs.writeFile('Links.html', html, (err) => {
            if (err) {
                console.error('Error writing to file:', err);
            }
        });
        const links = await getLinksFromAlt(html);
        return links;
    } catch (error) {
        console.error('Error:', error);
        return [];
    }
}

async function aggregateData(links) {
    const aggregatedData = [];
    for (const link of links) {
        try {
            const url = 'https://socialblade.com' + link;
            const response = await axios.get(url, { headers });
            const html = response.data;
            const days_30 = parseLast30DaysData(html);
            const SocialBladeRanking = parseSocialbladeData(html, link);
            const BasicInfo = await getSpanDataFromYouTubeUserTopInfo(html);
            const cleanedData = await cleanData(html);
            const filteredData = await filterLast30DaysData(cleanedData);
            const ProfileGrowth = await calculatePercentageGrowth(filteredData);
            const svgData = await parseHighchartsScript(html);
            const extractedData = svgData.map(item => {
                return {
                    containerId: item.containerId,
                    seriesData: item.config.series[0].data
                };
            });
            
            aggregatedData.push({ "social": link.split('/user/')[0].replace('/', ''), BasicInfo, ProfileGrowth, SocialBladeRanking, days_30, "data": filteredData, extractedData });
        } catch (error) {
            console.error('Error:', error);
            aggregatedData.push({ BasicInfo: [], ProfileGrowth: {}, SocialBladeRanking: {}, days_30: {}, extractedData: [] });
        }
    }
    return aggregatedData;
}

module.exports = {
    Get_All_Social_Media,
    aggregateData
};