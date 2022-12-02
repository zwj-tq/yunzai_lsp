import plugin from "../../lib/plugins/plugin.js";
import { segment } from "oicq";
import fs from "fs";
import http from "http";
import download from "download";

export class example extends plugin {
  constructor() {
    super({
      name: "test",
      dsc: "测试",
      event: "message",
      priority: 10000,
      rule: [
        {
          reg: "^(#|)+(AI|Ai|ai|小菲)+(开启|open|Open|OPEN|启动)",
          fnc: "AddAI",
        },
        {
          reg: "^(#|)+(AI|Ai|ai|小菲)+(关闭|close|Close|CLOSE)",
          fnc: "DelAI",
        },
        {
          reg: "(荡平|征服)+(三界|世界)",
          fnc: "duizhang",
        },
        {
          reg: "^(天晴|tq)+(多|)+(来点|)+(色图|sese|涩涩|涩图|gkd|GKD)",
          fnc: "moreSese",
        },
        {
          reg: "^(#|)+(下载.)+(jk|bais|heis|jur|mcn|zuk)+(.)+([0-9])$",
          fnc: "Download",
        },
        {
          reg: "",
          fnc: "aiReply",
        },
      ],
    });
  }
  inArray(search, array) {
    for (var i of array) {
      if (i == search) {
        return true;
      }
    }
    return false;
  }
  async DelAI(e) {
    let qq = [];
    if (e.user_id == "1106763138") {
      redis.set("ai_qq", qq.toString());
      this.e.reply("行吧我走了");
      return true;
    }
    await redis.get("ai_qq").then((result) => {
      qq = result.split(",");
    });
    if (qq == null) {
      return true;
    }
    if (this.inArray(e.user_id, qq)) {
      qq = qq.filter((item) => item != e.user_id);
      redis.set("ai_qq", qq.toString());
      this.e.reply("行吧我走了");
    }
    console.log(qq);
    return true;
  }
  async AddAI(e) {
    let qq = [];
    await redis.get("ai_qq").then((result) => {
      qq = result.split(",");
    });

    if (qq == null) {
      qq = [];
      qq.push(e.user_id);
      redis.set("ai_qq", qq.toString());
    } else if (!this.inArray(e.user_id, qq)) {
      qq.push(e.user_id);
      redis.set("ai_qq", qq.toString());
      this.e.reply("你好，我来了。");
    } else {
      this.e.reply("你已经在和我对话了呢。");
    }
    console.log(qq);
    return true;
  }
  async duizhang(e) {
    if (e.user_id != "877515177") {
      return true;
    }
    await this.e.reply(segment.image("./resources/pa.jpg"));
    return true;
  }
  async aiReply(e) {
    let qq = [];
    await redis.get("ai_qq").then((result) => {
      qq = result.split(",");
    });
    if (!this.inArray(e.user_id, qq)) {
      return;
    }
    http.get(
      `http://api.qingyunke.com/api.php?key=free&appid=0&msg=${e.message[0].text}`,
      (res) => {
        res.setEncoding("utf-8");
        let rawData = ""; //定义一个字符变量
        res.on("data", (chunk) => {
          rawData += chunk;
        }); //通过data事件拼接数据流得到数据
        res.on("end", () => {
          this.e.reply(JSON.parse(rawData).content);
        });
      }
    );
  }
  async moreSese(e) {
    if (Math.round(Math.random() * 2 == 1)) {
      this.e.reply(segment.image("./resources/pa.jpg"));
    } else {
      let msgList = [];
      let num = Math.round(Math.random() * 10);
      for (let i = 0; i < num; i++) {
        msgList.push({
          message: segment.image(
            "./resources/result/img/jk_" +
              Math.round(Math.random() * 50) +
              ".jpg"
          ),
          nickname: e.nickname,
          user_id: e.user_id,
        });
      }
      await this.e.reply(await Bot.makeForwardMsg(msgList, "sexy~"));
    }
    return true;
  }
  async Download(e) {
    const getImgStr = (path, num = -1) => {
      let imgs = fs
        .readFileSync("./resources/result/" + path + ".txt", "UTF-8")
        .split("\n");
      if (num < 0) {
        return imgs;
      }
      let msgList = [];
      for (let i = 0; i < num; i++) {
        msgList.push({
          message: segment.image(
            imgs[Math.round(Math.random() * (imgs.length - 1))]
          ),
          nickname: Bot.nickname,
          user_id: Bot.uin,
        });
      }
      return msgList;
    };
    let msg = e.message[0].text.split(".");
    await e.reply("真拿你没办法...(一边摇头一边掏百宝袋.jpg)");
    let imgs = getImgStr(msg[1]);
    let index;
    await redis.get("seseIndex" + msg[1]).then((result) => {
      index = result;
    });
    if (index == null) {
      index = msg[2];
    } else {
      index = index;
    }
    let i = index;
    for (i = index; i < imgs.length; i++) {
      var element = imgs[i];
      await download(element, "./resources/result/img/", {
        filename: msg[1] + "_" + i + ".jpg",
      });
      redis.set("seseIndex" + msg[1], i.toString());
      e.reply(i.toString() + "/" + imgs.length);
    }
    await e.reply("共下载了" + i + "张图片。");
    return true;
  }
}
