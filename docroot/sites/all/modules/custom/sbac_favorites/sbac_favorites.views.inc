<?php

/**
 * Implements hook_views_data().
 *
 * @return mixed
 */
function sbac_favorites_views_data() {
  $data['sbac_favorites']['table']['group'] = t('SBAC Favorites');
  // Base table.
  $data['sbac_favorites']['table']['base'] = array(
    'field' => 'id', // This is the identifier field for the view.
    'title' => t('SBAC Favorites'),
    'help' => t('Custom data for user favorites.'),
    'weight' => -10,
  );
  // Join.
  $data['sbac_favorites']['table']['join'] = array(
    'users' => array(
      'left_table' => 'users',
      'left_field' => 'uid',
      'field' => 'uid',
    ),
    'node' => array(
      'left_table' => 'node',
      'left_field' => 'nid',
      'field' => 'id',
      'type' => 'LEFT',
//      'extra' => array(
//        array('field' => 'type', 'value' => 'node', 'operator' => '='),
//      ),
    ),
  );


  // Entity ID table field.
  $data['sbac_favorites']['id'] = array(
    'title' => t('Entity ID'),
    'help' => t('The entity id.'),
    'field' => array(
      'handler' => 'views_handler_field_numeric',
      'click sortable' => TRUE,
    ),
    'filter' => array(
      'handler' => 'views_handler_filter_numeric',
    ),
    'sort' => array(
      'handler' => 'views_handler_sort',
    ),
    'argument' => array(
      'handler' => 'views_handler_argument',
    ),
    'relationship' => array(
      'base' => 'node',
      'base field' => 'nid',
      'handler' => 'views_handler_relationship',
      'label' => t('Favorite'),
      'title' => t('Favorite'),
      'help' => t('The Favorited item'),
    ),
  );

  // User ID field.
  $data['sbac_favorites']['uid'] = array(
    'title' => t('User ID'),
    'help' => t('User ID.'),
    'field' => array(
      'handler' => 'views_handler_field_numeric',
      'click sortable' => TRUE,
    ),
    'filter' => array(
      'handler' => 'views_handler_filter_numeric',
    ),
    'sort' => array(
      'handler' => 'views_handler_sort',
    ),
    'argument' => array(
      'handler' => 'views_handler_argument',
    ),
    'relationship' => array(
      'base' => 'users',
      'base field' => 'uid',
      'handler' => 'views_handler_relationship',
      'label' => t('Favoritor'),
      'title' => t('Favoritor'),
      'help' => t('The user who added the favorite'),
    ),
  );

  // Collection ID field.
  $data['sbac_favorites']['cid'] = array(
    'title' => t('Collection ID'),
    'help' => t('Collection ID.'),
    'field' => array(
      'handler' => 'views_handler_field_numeric',
      'click sortable' => TRUE,
    ),
    'filter' => array(
      'handler' => 'views_handler_filter_numeric',
    ),
    'sort' => array(
      'handler' => 'views_handler_sort',
    ),
    'argument' => array(
      'handler' => 'views_handler_argument',
    ),
    'relationship' => array(
      'base' => 'node',
      'base field' => 'nid',
      'handler' => 'views_handler_relationship',
      'label' => t('Collection'),
      'title' => t('Collection'),
      'help' => t('Collection for the Favorited item'),
    ),
  );

  // Type fields
  $data['sbac_favorites']['type'] = array(
    'title' => t('Type'),
    'help' => t('Type'),
    'field' => array(
      'handler' => 'views_handler_field',
      'click sortable' => TRUE,
    ),
    'filter' => array(
      'handler' => 'views_handler_filter_string',
    ),
    'sort' => array(
      'handler' => 'views_handler_sort',
    ),
    'argument' => array(
      'handler' => 'views_handler_argument_string',
    ),
  );

  // Weight fields
  $data['sbac_favorites']['weight'] = array(
    'title' => t('Weight'),
    'help' => t('Weight'),
    'field' => array(
      'handler' => 'views_handler_field_numeric',
      'click sortable' => TRUE,
    ),
    'filter' => array(
      'handler' => 'views_handler_filter_numeric',
    ),
    'sort' => array(
      'handler' => 'views_handler_sort',
    ),
  );

  // Created fields
  $data['sbac_favorites']['created'] = array(
    'title' => t('Created'),
    'help' => t('Created'),
    'field' => array(
      'handler' => 'views_handler_field_numeric',
      'click sortable' => TRUE,
    ),
    'filter' => array(
      'handler' => 'views_handler_filter_numeric',
    ),
    'sort' => array(
      'handler' => 'views_handler_sort',
    ),
  );

  return $data;
}
