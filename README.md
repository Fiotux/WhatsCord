# Why?

Did you ever have the specific problem that you have way too many devices for WhatsApp's 4 device limit, and you use discord all the time and wish that you could just chat with your WhatsApp Contacts inside of discord?

Well, now you can!
And the only things you need are [nodejs](https://nodejs.org/en/download), [Discord](https://discord.com/app) and of course WhatsApp.
(and optionally [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git))


# Installation

Before we begin you should create a new private discord Server for usage and a discord bot on the [Developer Portal](https://discord.com/developers/applications)

The first step is to clone this repository

    git clone https://github.com/Fiotux/WhatsCord.git

    cd WhatsCord

Inside the folder, open a command prompt and  install the dependencies

    npm install

After installing the dependencies, you have to fill out the ``config.json`` file

Example:

    {
    
    "token":  "NjYwOTA0MTQzNDU5NzEzMDU2.X9O2_g.ZD4DacsvTl9jH3VI3pNzDeocsHk",
    
    "guild":  "788856277223735296",
    
    "groupcategory":  "858001700215455764",
    
    "privatecategory":  "799994116519624704",
    
    "discordaccountid":  "518112276788543539",
    
    "sendaudioasvoice":  true
    
    }
The token field requires your bots token.
The guild field requires the id of the discord Server you want to do this in
The privatecategory field requires the id of the channel category for your private chats
The groupcategory field requires the id of the channel category for your group chats
The discordaccountid field requires the id of your discord account
The sendaudioasvoice field requires either false or true if you want to send audio files as a normal audio file or as a voice message on WhatsApp

After that you can start the Skript

    node index.js
And then wait until a qr code loads.
Open WhatsApp on your main phone and go into the add new device menu and scan the qr code to login to whatsapp.

Now everytime someone messages you a new channel that is synced to that contact will be created.
You can now just type into the chat or send pictures or audios to chat with the person.
