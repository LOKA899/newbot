const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config.js');
const permissionChecker = require('./utils/permissionChecker');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages
    ],
    partials: [Partials.Channel]
});

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Event handlers
client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
    console.log(`Loaded ${client.commands.size} commands`);
    console.log('Admin Role ID:', config.adminRoleId);
    console.log('Moderator Role ID:', config.moderatorRoleId);
    console.log('Participant Role ID:', config.participantRoleId);
    console.log('Bot is ready to process commands!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() && !interaction.isButton()) return;

    if (interaction.isCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
            console.log(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            // Enhanced logging for debugging
            console.log(`Executing command: ${interaction.commandName}`);
            console.log('User roles:', Array.from(interaction.member.roles.cache.map(r => `${r.name} (${r.id})`)));
            console.log('Command options:', interaction.options.data);

            await command.execute(interaction);
            console.log(`Successfully executed command: ${interaction.commandName}`);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}:`);
            console.error(error);
            await interaction.reply({
                content: 'There was an error executing this command!',
                ephemeral: true
            }).catch(error => console.error('Failed to send error message:', error));
        }
    }

    if (interaction.isButton()) {
        // Check if user has at least participant role for button interactions
        if (!permissionChecker.hasPermission(interaction.member, 'hlp')) {
            await interaction.reply({
                content: 'You need at least participant role to interact with the lottery.',
                ephemeral: true
            });
            return;
        }

        const buttonHandler = require('./utils/buttonHandlers');
        try {
            console.log(`Processing button interaction: ${interaction.customId}`);
            await buttonHandler.handleButton(interaction);
            console.log(`Successfully processed button: ${interaction.customId}`);
        } catch (error) {
            console.error('Button interaction error:', error);
            await interaction.reply({
                content: 'There was an error processing this button!',
                ephemeral: true
            }).catch(error => console.error('Failed to send error message:', error));
        }
    }
});

// Error handling for uncaught exceptions
process.on('uncaughtException', error => {
    console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

client.login(config.token).catch(error => {
    console.error('Failed to login:', error);
    process.exit(1);
});