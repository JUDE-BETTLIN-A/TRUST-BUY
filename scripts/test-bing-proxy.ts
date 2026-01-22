
import axios from 'axios';

async function testBingImageProxy() {
    const title = "Apple iPhone 12 128 GB";
    const url = `https://tse2.mm.bing.net/th?q=${encodeURIComponent(title)}&w=500&h=500&c=7&rs=1&p=0`;

    console.log("Testing URL:", url);

    try {
        const response = await axios.get(url);
        console.log("Status:", response.status);
        console.log("Content-Type:", response.headers['content-type']);
        console.log("Content-Length:", response.headers['content-length']);
    } catch (e) {
        console.error("Error fetching image:", (e as any).message);
    }
}

testBingImageProxy();
