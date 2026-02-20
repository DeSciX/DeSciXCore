/**
 * MCP Prompts for DeSciX - Predefined prompt templates
 */
export class DeSciXMCPPrompts {
    constructor(defaultContext = {}) {
        this.defaultContext = defaultContext;
    }

    /**
     * Get all available prompts
     */
    getPrompts() {
        return [
            {
                name: 'explain-concept',
                description: 'Get a detailed explanation of a concept from the knowledge base',
                arguments: [
                    {
                        name: 'concept',
                        description: 'The concept to explain',
                        required: true
                    },
                    {
                        name: 'detail',
                        description: 'Level of detail (brief, detailed, technical)',
                        required: false
                    }
                ]
            },
            {
                name: 'find-related',
                description: 'Find files and concepts related to a topic',
                arguments: [
                    {
                        name: 'topic',
                        description: 'Topic to find related content for',
                        required: true
                    }
                ]
            },
            {
                name: 'summarize-kb',
                description: 'Get an overview of what\'s in a knowledge base',
                arguments: []
            }
        ];
    }

    /**
     * Get a specific prompt
     */
    async get(name, args = {}) {
        const prompts = this.getPrompts();
        const prompt = prompts.find(p => p.name === name);
        
        if (!prompt) {
            throw new Error(`Prompt not found: ${name}`);
        }

        // Build prompt text based on name and args
        let promptText = '';
        
        switch (name) {
            case 'explain-concept':
                promptText = `Explain the concept "${args.concept || ''}"`;
                if (args.detail) {
                    promptText += ` with ${args.detail} detail`;
                }
                break;
            
            case 'find-related':
                promptText = `Find files and concepts related to "${args.topic || ''}"`;
                break;
            
            case 'summarize-kb':
                promptText = 'Provide an overview and summary of the knowledge base contents';
                break;
            
            default:
                promptText = prompt.description;
        }

        return {
            name: prompt.name,
            description: prompt.description,
            arguments: prompt.arguments,
            messages: [
                {
                    role: 'user',
                    content: promptText
                }
            ]
        };
    }
}

export default DeSciXMCPPrompts;

