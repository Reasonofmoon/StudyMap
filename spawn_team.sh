#!/bin/bash

# Export environment variables
export ANTHROPIC_AUTH_TOKEN=""
export CLAUDE_CODE_DISABLE_AUTO_MEMORY=0

echo "🚀 Spawning Antigravity Prime Agent Team..."

# Function to spawn an agent
spawn_agent() {
    local role=$1
    local model=$2
    local config_dir=$3
    local prompt_file="$config_dir/spawn-prompt.txt"

    echo "📝 Creating spawn prompt for $role..."

    # Build spawn prompt
    cat > "$prompt_file" << EOF
# Antigravity Prime Agent Spawn Prompt

## Shared Context (from CLAUDE.md)
- **Role**: Full Stack AI Agent
- **Knowledge Base**: ./brain → Z:/Brain (Obsidian 연결)
- **Principles**: MECE + Type-Safe Modularity

## Agent Role: $role
$([ -f "$config_dir/AGENT.md" ] && cat "$config_dir/AGENT.md")

## Memory Context
$([ -f "$config_dir/memory.md" ] && cat "$config_dir/memory.md")

## Available Skills
$([ -f "$config_dir/skills.yaml" ] && cat "$config_dir/skills.yaml")

## Shared Resources
- Memory files: .team/memory/
- Common skills: .team/skills/common/
- Project root: CLAUDE.md

## Instructions
- Follow the Manager-Editor-Browser Loop Protocol
- Use Type-Safe modular principles
- Make minimal changes
- Follow MECE analysis
- Collaborate with team members

## Model: $model
EOF

    echo "✅ Spawn prompt created for $role"
}

# Spawn each agent with their configuration
spawn_agent "architect" "sonnet" ".team/agents/architect"
spawn_agent "builder-1" "sonnet" ".team/agents/builder-1"
spawn_agent "builder-2" "sonnet" ".team/agents/builder-2"
spawn_agent "tester" "haiku" ".team/agents/tester"
spawn_agent "devops" "haiku" ".team/agents/devops"

echo ""
echo "🎯 Agent Team Spawn Configuration Complete!"
echo ""
echo "📁 Team Structure:"
echo "   🏗️  Architect: .team/agents/architect/"
echo "   🔨 Builder-1: .team/agents/builder-1/"
echo "   🔨 Builder-2: .team/agents/builder-2/"
echo "   🧪 Tester: .team/agents/tester/"
echo "   🚀 DevOps: .team/agents/devops/"
echo ""
echo "📂 Shared Resources:"
echo "   🗃️  Memory: .team/memory/"
echo "   🛠️  Skills: .team/skills/common/"
echo ""
echo "🔄 Ready for Delegate Mode!"
echo "   Lead: Coordinator (does NOT write code)"
echo "   Coordination: Use 'message' for specific agents"
echo "   Quality Gates: Typecheck, lint, and tests required"