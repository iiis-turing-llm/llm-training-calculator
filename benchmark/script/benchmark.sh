#!/bin/bash

SHELL_FOLDER=$(cd "$(dirname "$0")";pwd)
cd ${SHELL_FOLDER}

source ../include/YCFile.sh
source ../include/YCLog.sh
source ../include/YCTool.sh
source ../include/YCOS.sh

####################################################
####################################################

show_usage() {
    appname=$0
    echo_info "Usage: ${appname} [command], e.g., ${appname} install"
    echo_info "  -- install"
    echo_info "  -- setup"
    echo_info "  -- train"
    echo_info "  -- help                          show help message"
}




install() {
    echo_back "cd ${SHELL_FOLDER}"
    echo_info "install megatron v3.02"
    echo_back "wget --no-check-certificate --content-disposition https://github.com/NVIDIA/Megatron-LM/archive/refs/tags/v3.0.2.zip"
    echo_back "unzip Megatron-LM-3.0.2.zip"
    echo_back  "cd ../"
    echo_back "mkdir Megatron"
    echo_back "mv script/Megatron-LM-3.0.2/*  Megatron"
    echo_back "rm -r script/Megatron-LM-3.0.2/"
    echo_info "install tracer"
    local _sw_list=(__init__.py schedules.py global_vars.py training.py)
    for _item in ${_sw_list[@]}
    do
        echo_back "cp script/${_item} Megatron/megatron/"
    done
}

setup() {
    echo_back "cd ${SHELL_FOLDER}"
    echo_back "cd ../Megatron"
    echo_info "we only provide a small dataset for correctness validation"
    echo_back "cp -r ../datasets ./"
    echo_back "cp ../examples/* examples/"
    mkdir_if_not_exist ngc_models
    echo_back "bash examples/pretrain_gpt_distributed_dataprep_small.sh"
}

train() {
    echo_back "cd ${SHELL_FOLDER}"
    echo_info "adjust parameters in the pretrain bash before training"
    echo_back "cd ../Megatron"
    echo_info "clear checkpoint"
    rmdir_if_exist ngc_models/release_gpt_base
    echo_back "bash examples/pretrain_gpt_distributed_small.sh"
}

################################################################
####################    * Main Process *    ####################
################################################################
export LC_ALL=C

if (( $# == 0 )); then
    echo_warn "Argument cannot be NULL!"
    show_usage
    exit 0
fi

username=`whoami | awk '{print $1}'`

global_choice=${1}
case ${global_choice} in
    "install")
        install
        ;;
    "setup")
        setup
        ;;
    "train")
        train
        ;;
    "help")
        show_usage 
        ;;
    *)
        echo_erro "Unrecognized argument!"
        show_usage
        ;;
esac
