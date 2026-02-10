#!/bin/bash
SESSION="antigravity-team"
WORKSPACE="/mnt/e/Dev/organized"

# 256컬러 지원 설정
export TERM=screen-256color

# 세션 시작
tmux new-session -d -s $SESSION -n "Control" -c "$WORKSPACE"

# 1. Manager (창 0.0) - Magenta/Purple 계열 (colour53)
tmux select-pane -t $SESSION:0.0 -P 'bg=colour53,fg=white'
tmux send-keys -t $SESSION:0.0 "export AGENT_ROLE=MANAGER; unset ANTHROPIC_AUTH_TOKEN; npx @anthropic-ai/claude-code" C-m

# 2. Editor (창 0.1) - Blue 계열 (colour17)
tmux split-window -h -c "$WORKSPACE"
tmux select-pane -t $SESSION:0.1 -P 'bg=colour17,fg=white'
tmux send-keys -t $SESSION:0.1 "export AGENT_ROLE=EDITOR; unset ANTHROPIC_AUTH_TOKEN; npx @anthropic-ai/claude-code" C-m

# 3. Browser (창 0.2) - Green 계열 (colour22)
tmux select-pane -t $SESSION:0.0
tmux split-window -v -c "$WORKSPACE"
tmux select-pane -t $SESSION:0.1 -P 'bg=colour22,fg=white'
tmux send-keys -t $SESSION:0.1 "export AGENT_ROLE=BROWSER; unset ANTHROPIC_AUTH_TOKEN; npx @anthropic-ai/claude-code" C-m

# 활성 창 테두리 강조 (노란색)
tmux set -g pane-active-border-style 'fg=yellow'
tmux select-layout tiled

# 사령탑 접속
tmux attach-session -t $SESSION
