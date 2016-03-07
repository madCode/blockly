/**
 * Blockly Demos: BlindBlockly
 *
 * Copyright 2016 Google Inc.
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Angular2 Component that details how Blockly.Block's are rendered in the workspace in BlindBlockly. Also handles any interactions with the blocks.
 * @author madeeha@google.com (Madeeha Ghori)
 */
var app = app || {};

app.TreeView = ng.core
  .Component({
    selector: 'tree-view',
    template: `
<li *ngIf='isTopBlock && block.previousConnection'>
  <select aria-label='block connection menu' (change)='inputMenuSelected(block.previousConnection, $event)'>
    <option value='NO_ACTION' select>select an action</option>
    <option value='MARK_SPOT'>Mark this spot</option>
    <option value='PASTE' disabled='{{notCompatibleWithClipboard(block.previousConnection)}}'>Paste</option>
  </select>
</li>
<li>
  <h3 style='color: red'>{{block.toString()}}</h3>
  <select aria-label='block menu' (change)='blockMenuSelected(block, $event)'>
    <option value='NO_ACTION' select>select an action</option>
    <option value='COPY_BLOCK'>copy</option>
    <option value='CUT_BLOCK'>cut</option>
    <option value='SEND_TO_SELECTED' disabled='{{notCompatibleWithMarkedBlock(block)}}'>move to selected input</option>
    <option value='DELETE_BLOCK'>delete</option>
  </select>
  <ol>
    <div *ngFor='#inputBlock of block.inputList'>
      <field-view *ngFor='#field of getInfo(inputBlock)' [field]='field'></field-view>
      <tree-view *ngIf='inputBlock.connection && inputBlock.connection.targetBlock()' [block]='inputBlock.connection.targetBlock()'></tree-view>
      <li *ngIf='inputBlock.connection && !inputBlock.connection.targetBlock()'>
        {{inputType(inputBlock.connection)}} {{valueOrStatement(inputBlock)}} needed:
        <select aria-label='insert input menu' (change)='inputMenuSelected(inputBlock.connection, $event)'>
          <option value='NO_ACTION' select>select an action</option>
          <option value='MARK_SPOT'>Mark this spot</option>
          <option value='PASTE' disabled='{{notCompatibleWithClipboard(inputBlock.connection)}}'>Paste</option>
        </select>
      </li>
    </div>
  </ol>
</li>
<li *ngIf='block.nextConnection'>
  <select aria-label='block connection menu' (change)='inputMenuSelected(block.nextConnection, $event)'>
    <option value='NO_ACTION' select>select an action</option>
    <option value='MARK_SPOT'>Mark this spot</option>
    <option value='PASTE' disabled='{{notCompatibleWithClipboard(block.nextConnection)}}'>Paste</option>
  </select>
</li>
<li *ngIf= 'block.nextConnection && block.nextConnection.targetBlock()'>
  <tree-view [block]='block.nextConnection.targetBlock()' [isTopBlock]='false'></tree-view>
</li>
    `,
    directives: [ng.core.forwardRef(
        function() { return app.TreeView; }), app.FieldView],
    inputs: ['block', 'isTopBlock'],
  })
  .Class({
    constructor: [app.ClipboardService, function(_service) {
      this.infoBlocks = {};
      this.nextBlock = {};
      this.sharedClipboardService = _service;
    }],
    getInfo: function(block) {
      //List all inputs
      if (this.infoBlocks[block.id]) {
        //TODO(madeeha): is there a situation in which overwriting often unnecessarily is a problem?
        this.infoBlocks[block.id].length = 0;
      } else {
        this.infoBlocks[block.id] = [];
      }

      var blockInfoList = this.infoBlocks[block.id];

      for (var j = 0, field; field = block.fieldRow[j]; j++) {
        blockInfoList.push(field);
      }

      return this.infoBlocks[block.id];
    },
    inputType: function(connection) {
      if (connection.check_) {
        return connection.check_.join(', ').toUpperCase();
      } else {
        return 'any';
      }
    },
    blockMenuSelected: function(block, event) {
      switch (event.target.value) {
        case 'DELETE_BLOCK':
          block.dispose(true);
          break;
        case 'CUT_BLOCK':
          this.sharedClipboardService.cut(block);
          break;
        case 'COPY_BLOCK':
          this.sharedClipboardService.copy(block);
          break;
        case 'SEND_TO_SELECTED':
          if (this.sharedClipboardService) {
            this.sharedClipboardService.pasteToMarkedConnection(block);
            block.dispose(true);
          }
          break;
      }
      event.target.selectedIndex = 0;
    },
    inputMenuSelected: function(connection, event) {
      switch (event.target.value) {
        case 'MARK_SPOT':
          this.sharedClipboardService.markConnection(connection);
          console.log("marked spot");
          break;
        case 'PASTE':
          this.sharedClipboardService.paste(connection);
          break;
      }
      event.target.selectedIndex = 0;
    },
    notCompatibleWithClipboard: function(connection) {
      if (this.sharedClipboardService.isConnectionCompatibleWithClipboard(
              connection)){
        //undefined will result in the 'paste' option being ENABLED
        return undefined;
      } else {
        //true will result in the 'paste' option being DISABLED
        return true;
      }
    },
    valueOrStatement: function(inputBlock) {
      if (inputBlock.type == Blockly.NEXT_STATEMENT){
        return "statement";
      } else {
        return "value";
      }
    },
    notCompatibleWithMarkedBlock: function(block) {
      if (this.sharedClipboardService.isBlockCompatibleWithMarkedConnection(block)) {
        //undefined will result in the 'copy to marked block' option being ENABLED
        return undefined;
      } else {
        //true will result in the 'copy to marked block' option being DISABLED
        return true;
      }
    },
    log: function(obj) {
      console.log(obj);
    }
  });
