<?php
/**
 * @file
 * sbac_lexicon.features.inc
 */

/**
 * Implements hook_ctools_plugin_api().
 */
function sbac_lexicon_ctools_plugin_api($module = NULL, $api = NULL) {
  if ($module == "ds" && $api == "ds") {
    return array("version" => "1");
  }
  if ($module == "elysia_cron" && $api == "default_elysia_cron_rules") {
    return array("version" => "1");
  }
  if ($module == "strongarm" && $api == "strongarm") {
    return array("version" => "1");
  }
}

/**
 * Implements hook_views_api().
 */
function sbac_lexicon_views_api($module = NULL, $api = NULL) {
  return array("api" => "3.0");
}
