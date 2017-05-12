/**
 * Created by thomasjeanneau on 09/04/2017.
 */

import PythonShell from 'python-shell';
import Promise from 'bluebird';

import { controller } from './configSlackbot';
import { checkIfAdmin } from './methods';
import { pairingConversation } from './pairingConversation';
import { startAPairingSession } from './startAPairingSession';
import { firstTimeConversation } from './firstTime';
import { getPerson, updatePerson} from '../airtable'

const options = {
  mode: 'text',
  pythonPath: 'python',
  scriptPath: './',
};

controller.hears("pair", ["direct_message", "direct_mention"], function (bot, message) {
  try {
    (async () => {
      const botReply = Promise.promisify(bot.reply);
      const isAdmin = await checkIfAdmin(bot, message);
      if (isAdmin) {
        await botReply(message, "Ok, I'll start pairing people");
        PythonShell.run("pairing.py", options, async function (error) {
          if (!error) {
            await botReply(message, "Pairing complete. Results should be available in airtable. You can run 'introductions' to send a message to each pair.")
          } else {
            console.log(error);
            await botReply(message, "An error occurred during pairing.")
          }
        })
      } else {
        await botReply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
      }
    })();
  } catch (e) {
    bot.reply(message, "An error occur: " + e.error);
  }
});

controller.hears("introductions", ["direct_message", "direct_mention"], (bot, message) => {
  try {
    (async () => {
      const botReply = Promise.promisify(bot.reply);
      const isAdmin = await checkIfAdmin(bot, message);
      if (isAdmin) {
        await botReply(message, "Ok, I'll start introducing people :sparkles: ");
        const membersPaired = await startAPairingSession(bot, message);
        await pairingConversation(bot, message, membersPaired);
        await botReply(message, "All people have been introduced :rocket:");
      } else {
        await botReply(message, "Sorry but it looks like you're not an admin. You can't use this feature.")
      }
    })();
  } catch (e) {
    bot.reply(message, "An error occur: " + e.error);
  }
});

controller.hears("first-time", ["direct_message", "direct_mention"], function(bot,message){
  console.log(message);
  try {
    firstTimeConversation(bot, message, {name: ""})
  } catch (e){
    console.log(e);
    bot.reply(message, "An error occurred: " + e);
  }
})


controller.hears("send-ft", ["direct_message", "direct_mention"], function(bot,message){
  console.log(message);
  try {
    checkIfAdmin(bot, message)
      .then((res)=>{
        if(res){
          bot.api.users.list({}, (err, r)=>{
            // Get all members
            r.members.forEach((member)=>{
              // For each member, start a firstTimeConversation
              if(member.real_name == "Saad Elbeleidy"){ // Remove this if statement for production
                firstTimeConversation(bot, {user: member.id}, {name: member.profile.first_name});
              } 
            });
            bot.reply(message, "All done!");
          })
        } else {
          bot.reply(message, "This option is only available to admins");
        }
      })
  } catch (e){
    console.log(e);
    bot.reply(message, "An error occurred: " + e);
  }
})

controller.hears("status",["direct_message", "direct_mention"], function(bot, message){
  // TODO
  console.log("status")
  bot.api.users.info({user:message.user}, (err, res)=>{ 
    console.log(res.user.name);
    getPerson('P2PL Tests',res.user.name, (err, rec)=>{
      console.log(rec.id);
      const status = rec.get("Active P2P") ? "active" : "inactive";
      bot.startPrivateConversation(message, (err, convo)=>{
        convo.say("Hi, Your current status is: " + status)
        convo.say("You can change your status by messaging me with `start` or `stop`")
      })
    })
  }) 
})

controller.hears("stop",["direct_message", "direct_mention"], function(bot, message){
  // TODO
  console.log("stop")
  bot.api.users.info({user:message.user}, (err, res)=>{ 
    console.log(res.user.name);
    updatePerson('P2PL Tests',res.user.name, {"Active P2P":false}, (err, rec)=>{
      if (err){
        console.log("Error occurred");
      }
      bot.startPrivateConversation(message, (err, convo)=>{
        convo.say("Okay 😥, sorry to see you go.")
        convo.say("You can start again by messaging me with `start`.")
      })
    })
  })
})

controller.hears("start",["direct_message", "direct_mention"], function(bot, message){
  // TODO
  console.log("start")
  bot.api.users.info({user:message.user}, (err, res)=>{ 
    console.log(res.user.name);
    updatePerson('P2PL Tests',res.user.name, {"Active P2P":true}, (err, rec)=>{
      if (err){
        console.log("Error occurred");
      }
      bot.startPrivateConversation(message, (err, convo)=>{
        convo.say("Amaaaaaaaaaaaazing 🎉'! I'll let you know when the next session starts! Happy Learning!")
      });
    })
  })
})

controller.hears(["help","options"],["direct_message", "direct_mention"], function(bot, message){
  bot.startConversation(message, (err, convo)=>{
    convo.say(`Hi, I'm the Learning Bot. You can message me one of the following things: \n
    \`help\` - this information\n
    \`first-time\` - an intro to the bot\n
    \`status\` - find out if you're active to be paired in the next session\n
    \`stop\` - stop being paired\n
    \`start\` - start being paired\n
    That's it. Happy Learning!`)
  })
})
