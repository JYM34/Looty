const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('license')
        .setDescription('Gestion de ta licence Steam Lua Manager')
        .addSubcommand(subcommand =>
            subcommand
                .setName('activer')
                .setDescription('Récupérer ou générer ta clé de licence')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Réinitialiser le HWID (si tu as changé de PC)')
        ),

    async run(client, interaction) {
        // --- 0. Vérification du Salon ---
        const allowedChannelId = process.env.LICENSE_CHANNEL_ID;
        
        // Si un salon est configuré ET que la commande n'est pas faite dedans
        if (allowedChannelId && interaction.channelId !== allowedChannelId) {
            return interaction.reply({ 
                content: `⛔ Cette commande ne peut être utilisée que dans le salon <#${allowedChannelId}>.`, 
                flags: 64 // Ephemeral
            });
        }

        // 1. Vérification du Rôle Client
        const clientRoleId = process.env.LICENSE_CLIENT_ROLE_ID;
        
        // Si un rôle est défini dans le .env, on vérifie
        if (clientRoleId && !interaction.member.roles.cache.has(clientRoleId)) {
            return interaction.reply({ 
                content: "⛔ Accès refusé...", 
                flags: MessageFlags.Ephemeral 
            });
        }

        const subCommand = interaction.options.getSubcommand();
        const apiUrl = process.env.LICENSE_SERVER_URL;
        const apiSecret = process.env.LICENSE_API_SECRET;

        if (!apiUrl || !apiSecret) {
            return interaction.reply({ content: "❌ Erreur de configuration du bot (API URL/Secret manquants).", ephemeral: true });
        }

        // On diffère la réponse car l'appel API peut prendre un peu de temps
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        try {
            console.log(`[DEBUG] Appel API vers: ${apiUrl}/api/admin/get-or-create`);
            console.log(`[DEBUG] Avec DiscordID: ${interaction.user.id}`);

            // --- SOUS-COMMANDE : ACTIVER ---
            if (subCommand === 'activer') {
                const response = await axios.post(`${apiUrl}/api/admin/get-or-create`, {
                    discordId: interaction.user.id,
                    discordName: interaction.user.username,
                    discordDisplayName: interaction.user.globalName || interaction.user.username 
                }, {
                    headers: { 'x-api-secret': apiSecret }
                });

                if (response.data.success) {
                    const key = response.data.key;
                    const isNew = response.data.isNew;

                    const embed = new EmbedBuilder()
                        .setColor(isNew ? 0x00FF00 : 0x0099FF)
                        .setTitle(isNew ? '🎉 Ta licence est prête !' : 'ℹ️ Ta licence existante')
                        .setDescription(`Voici ta clé personnelle. Ne la partage pas !\n\n\`\`\`${key}\`\`\``)
                        .addFields(
                            { name: '📝 Instructions', value: '1. Ouvre l\'application SLM\n2. Colle cette clé\n3. Clique sur Activer' }
                        )
                        .setFooter({ text: 'Steam Lua Manager • by JYM' });

                    // 1. Essayer d'envoyer en MP d'abord
                    try {
                        await interaction.user.send({ embeds: [embed] });
                        
                        // 2. Si le MP marche, on confirme juste dans le salon
                        await interaction.editReply({ 
                            content: "✅ Je t'ai envoyé ta clé de licence en Message Privé ! 📩",
                            embeds: [] // On vide les embeds s'il y en avait
                        });
                        
                    } catch (error) {
                        // 3. Si les MP sont bloqués, on l'affiche ici en éphémère (secours)
                        await interaction.editReply({ 
                            content: "⚠️ Je ne peux pas t'envoyer de MP (bloqués ?). Voici ta clé ici :",
                            embeds: [embed] 
                        });
                    }

                } else {
                    await interaction.editReply(`❌ Erreur serveur : ${response.data.error}`);
                }
            }

            // --- SOUS-COMMANDE : RESET ---
            else if (subCommand === 'reset') {
                const response = await axios.post(`${apiUrl}/api/admin/reset-hwid`, {
                    discordId: interaction.user.id
                }, {
                    headers: { 'x-api-secret': apiSecret }
                });

                if (response.data.success) {
                    const embed = new EmbedBuilder()
                        .setColor(0xFFA500) // Orange
                        .setTitle('🔄 Reset effectué')
                        .setDescription('Ta licence a été détachée de ton ancien PC.\nTu peux maintenant l\'activer sur ta nouvelle machine.')
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                } else {
                    await interaction.editReply(`❌ Erreur : ${response.data.error || 'Impossible de reset.'}`);
                }
            }

        } catch (error) {
            console.error("Erreur commande licence:", error.message);
            if (error.response) {
                await interaction.editReply(`❌ Erreur API (${error.response.status}): ${error.response.data.error || 'Inconnue'}`);
            } else {
                await interaction.editReply("❌ Impossible de contacter le serveur de licence.");
            }
        }
    }
};
