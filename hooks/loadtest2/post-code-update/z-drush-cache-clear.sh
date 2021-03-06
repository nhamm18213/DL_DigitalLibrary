#!/bin/sh
#
# Cloud Hook: drush-cache-clear
#
# Run drush cache-clear all in the target environment. This script works as
# any Cloud hook.


# Map the script inputs to convenient names.
site=$1
target_env=$2
drush_alias=$site'.'$target_env

# Execute a standard drush command.
 drush @$drush_alias cc all
 drush @$drush_alias fra -y
 drush @$drush_alias updb -y
 drush @$drush_alias cc all
 drush @$drush_alias fra -y
 drush @$drush_alias cc all

 drush @$drush_alias en -y reroute_email
 drush @$drush_alias vset reroute_email_address dlmailtest@gedu-demo-pcg.com
 drush @$drush_alias vset reroute_enable 1
