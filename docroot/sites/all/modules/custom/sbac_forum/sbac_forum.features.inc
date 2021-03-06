<?php
/**
 * @file
 * sbac_forum.features.inc
 */

/**
 * Implements hook_ctools_plugin_api().
 */
function sbac_forum_ctools_plugin_api($module = NULL, $api = NULL) {
  if ($module == "context" && $api == "context") {
    return array("version" => "3");
  }
  if ($module == "ds" && $api == "ds") {
    return array("version" => "1");
  }
  if ($module == "field_group" && $api == "field_group") {
    return array("version" => "1");
  }
  if ($module == "strongarm" && $api == "strongarm") {
    return array("version" => "1");
  }
}

/**
 * Implements hook_views_api().
 */
function sbac_forum_views_api($module = NULL, $api = NULL) {
  return array("api" => "3.0");
}

/**
 * Implements hook_image_default_styles().
 */
function sbac_forum_image_default_styles() {
  $styles = array();

  // Exported image style: forum_profile_image_120x120.
  $styles['forum_profile_image_120x120'] = array(
    'label' => 'forum_profile_image_120x120',
    'effects' => array(
      1 => array(
        'name' => 'image_scale_and_crop',
        'data' => array(
          'width' => 120,
          'height' => 120,
        ),
        'weight' => 1,
      ),
    ),
  );

  // Exported image style: forum_profile_image_60x60.
  $styles['forum_profile_image_60x60'] = array(
    'label' => 'forum_profile_image_60x60',
    'effects' => array(
      1 => array(
        'name' => 'image_scale_and_crop',
        'data' => array(
          'width' => 60,
          'height' => 60,
        ),
        'weight' => 1,
      ),
    ),
  );

  return $styles;
}

/**
 * Implements hook_node_info().
 */
function sbac_forum_node_info() {
  $items = array(
    'topic' => array(
      'name' => t('Topic'),
      'base' => 'node_content',
      'description' => t('Forum Topic'),
      'has_title' => '1',
      'title_label' => t('Discussion Title'),
      'help' => '',
    ),
  );
  drupal_alter('node_info', $items);
  return $items;
}
