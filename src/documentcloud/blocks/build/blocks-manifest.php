<?php
// This file is generated. Do not modify it manually.
return array(
	'documentcloud' => array(
		'$schema' => 'https://schemas.wp.org/trunk/block.json',
		'apiVersion' => 3,
		'name' => 'documentcloud/documentcloud',
		'version' => '0.1.0',
		'title' => 'DocumentCloud',
		'category' => 'embed',
		'description' => 'Allows embedding the DocumentCloud documents, pages and notes on your page.',
		'example' => array(
			
		),
		'attributes' => array(
			'url' => array(
				'type' => 'string',
				'default' => ''
			),
			'documentId' => array(
				'type' => 'string',
				'default' => ''
			),
			'useDocumentId' => array(
				'type' => 'boolean',
				'default' => false
			),
			'height' => array(
				'type' => 'string',
				'default' => ''
			),
			'width' => array(
				'type' => 'string',
				'default' => ''
			),
			'title' => array(
				'type' => 'boolean',
				'default' => true
			),
			'fullscreen' => array(
				'type' => 'boolean',
				'default' => true
			),
			'onlyshoworg' => array(
				'type' => 'boolean',
				'default' => false
			),
			'pdf' => array(
				'type' => 'boolean',
				'default' => null
			),
			'embeddedHtml' => array(
				'type' => 'string',
				'default' => ''
			)
		),
		'supports' => array(
			'html' => false,
			'align' => true
		),
		'textdomain' => 'documentcloud',
		'editorScript' => 'file:./index.js',
		'editorStyle' => 'file:./index.css'
	)
);
