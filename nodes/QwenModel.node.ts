import {
    INodeType,
    INodeTypeDescription,
    INodeExecutionData,
    INodeParameters,
    IExecuteFunctions,
} from 'n8n-workflow';

import axios from 'axios';

export class QwenModel implements INodeType {
    description: INodeTypeDescription = {
        displayName: 'Qwen Model',
        name: 'qwenModel',
        icon: 'file:qwen.svg',
        group: ['transform'],
        version: 1,
        description: 'Interact with Qwen models from Alibaba Cloud',
        defaults: {
            name: 'Qwen Model',
            color: '#1A82E2',
        },
        inputs: ['main'],
        outputs: ['main'],
        credentials: [
            {
                name: 'alibabaCloudApi',
                required: true,
            },
        ],
        properties: [
            {
                displayName: 'Model Category',
                name: 'modelCategory',
                type: 'options',
                options: [
                    { name: 'Paid Models', value: 'paid' },
                    { name: 'Free Trial Models', value: 'freeTrial' },
                    { name: 'Reasoning Models', value: 'reasoning' },
                    { name: 'Reasoning Free Trial Models', value: 'reasoningFreeTrial' },
                    { name: 'Embeddings Models', value: 'embeddings' },
                    { name: 'Visual Models', value: 'visual' },
                    { name: 'Visual Free Trial Models', value: 'visualFreeTrial' },
                ],
                default: 'paid',
                description: 'Select the category of the Qwen model to use',
            },
            {
                displayName: 'Model Name',
                name: 'modelName',
                type: 'options',
                displayOptions: {
                    show: {
                        modelCategory: [
                            'paid',
                            'freeTrial',
                            'reasoning',
                            'reasoningFreeTrial',
                            'embeddings',
                            'visual',
                            'visualFreeTrial',
                        ],
                    },
                },
                options: [],
                default: '',
                required: true,
                description: 'Select the Qwen model to use',
            },
            {
                displayName: 'Prompt',
                name: 'prompt',
                type: 'string',
                default: '',
                required: true,
                description: 'The prompt to send to the Qwen model',
            },
        ],
    };

    async loadOptions(this: IExecuteFunctions): Promise<INodePropertyOptions[]> {
        const modelOptions = {
            paid: [
                { name: 'qwen-max', value: 'qwen-max' },
                { name: 'qwen-plus', value: 'qwen-plus' },
                { name: 'qwen-max-latest', value: 'qwen-max-latest' },
                { name: 'qwen-plus-latest', value: 'qwen-plus-latest' },
                { name: 'qwen-max-2025-01-25', value: 'qwen-max-2025-01-25' },
                { name: 'qwen-plus-2025-01-25', value: 'qwen-plus-2025-01-25' },
                { name: 'qwen-turbo-latest', value: 'qwen-turbo-latest' },
                { name: 'qwen-turbo', value: 'qwen-turbo' },
                { name: 'qwen-turbo-2024-11-01', value: 'qwen-turbo-2024-11-01' },
                { name: 'qvq-max-2025-03-25', value: 'qvq-max-2025-03-25' },
            ],
            freeTrial: [
                { name: 'qwen2.5-14b-instruct-1m', value: 'qwen2.5-14b-instruct-1m' },
                { name: 'qwen2.5-72b-instruct', value: 'qwen2.5-72b-instruct' },
                { name: 'qwen2.5-32b-instruct', value: 'qwen2.5-32b-instruct' },
                { name: 'qwen2.5-14b-instruct', value: 'qwen2.5-14b-instruct' },
                { name: 'qwen2.5-14b-instruct-1m', value: 'qwen2.5-14b-instruct-1m' },
                { name: 'qwen2.5-7b-instruct', value: 'qwen2.5-7b-instruct' },
                { name: 'qwen2.5-7b-instruct-1m', value: 'qwen2.5-7b-instruct-1m' },
            ],
            reasoning: [
                { name: 'qwq-plus', value: 'qwq-plus' },
            ],
            reasoningFreeTrial: [
                { name: 'qvq-max', value: 'qvq-max' },
                { name: 'qvq-max-latest', value: 'qvq-max-latest' },
                { name: 'qvq-max-2025-03-25', value: 'qvq-max-2025-03-25' },
            ],
            embeddings: [
                { name: 'text-embedding-v3', value: 'text-embedding-v3' },
            ],
            visual: [
                { name: 'qwen-vl-max', value: 'qwen-vl-max' },
                { name: 'qwen-vl-plus', value: 'qwen-vl-plus' },
                { name: 'qwen2.5-vl-72b-instruct', value: 'qwen2.5-vl-72b-instruct' },
            ],
            visualFreeTrial: [
                { name: 'qwen2.5-vl-32b-instruct', value: 'qwen2.5-vl-32b-instruct' },
                { name: 'qwen2.5-vl-7b-instruct', value: 'qwen2.5-vl-7b-instruct' },
                { name: 'qwen2.5-vl-3b-instruct', value: 'qwen2.5-vl-3b-instruct' },
            ],
        };

        const category = this.getNodeParameter('modelCategory') as string;
        return modelOptions[category] || [];
    }

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
        const items = this.getInputData();
        const returnItems: INodeExecutionData[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            const credentials = await this.getCredentials('alibabaCloudApi');
            if (!credentials || !credentials.accessKeyId || !credentials.accessKeySecret) {
                throw new Error('Alibaba Cloud API credentials are missing.');
            }

            const accessKeyId = credentials.accessKeyId as string;
            const accessKeySecret = credentials.accessKeySecret as string;
            const modelName = this.getNodeParameter('modelName', i) as string;
            const prompt = this.getNodeParameter('prompt', i) as string;

            const url = `https://api.alibabacloud.com/v1/models/${modelName}/chat`;

            try {
                const response = await axios.post(url, {
                    prompt: prompt,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessKeyId}:${accessKeySecret}`,
                    },
                });

                item.json.response = response.data;
                returnItems.push(item);
            } catch (error) {
                if (error.response) {
                    item.json.error = error.response.data;
                } else {
                    item.json.error = error.message;
                }
                returnItems.push(item);
            }
        }

        return [this.helpers.returnJsonArray(returnItems)];
    }
}